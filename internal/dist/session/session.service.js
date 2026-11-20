"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const configuration_1 = require("../config/configuration");
const http_client_1 = require("../common/http/http-client");
const tiktok_errors_1 = require("../common/errors/tiktok-errors");
const app_context_1 = require("./app-context");
let SessionService = SessionService_1 = class SessionService {
    config;
    http;
    logger = new common_1.Logger(SessionService_1.name);
    current;
    inflight;
    constructor(config, http) {
        this.config = config;
        this.http = http;
    }
    async get() {
        const session = this.current;
        if (session && this.isUsable(session)) {
            session.requestCount += 1;
            return session;
        }
        return this.bootstrap();
    }
    invalidate(reason) {
        if (this.current) {
            this.logger.debug(`Dropping session: ${reason}`);
        }
        this.current = undefined;
    }
    describe() {
        const s = this.current;
        if (!s) {
            throw new tiktok_errors_1.SessionBootstrapError('No session has been bootstrapped yet.', {}, 'Call any TikTok endpoint first, or GET /internal/session to force a bootstrap.');
        }
        const { cookies, cookieHeader: _cookieHeader, ...rest } = s;
        return { ...rest, cookieNames: Object.keys(cookies) };
    }
    isUsable(session) {
        if (Date.now() >= session.expiresAt)
            return false;
        if (session.requestCount >= this.config.session.maxRequestsPerSession)
            return false;
        return Boolean(session.msToken);
    }
    async bootstrap() {
        if (this.inflight)
            return this.inflight;
        const task = this.performBootstrap().finally(() => {
            this.inflight = undefined;
        });
        this.inflight = task;
        return task;
    }
    async performBootstrap() {
        const cookies = {};
        const now = Date.now();
        await this.registerDevice(cookies);
        const { appContext, ttwid } = await this.loadIdentity(cookies);
        if (!ttwid) {
            throw new tiktok_errors_1.SessionBootstrapError('TikTok did not issue a ttwid cookie during session bootstrap.', { cookies: Object.keys(cookies) }, 'The edge may be rejecting this egress IP outright. Try a different ' +
                'network or set TIKTOK_PROXY_URL to a residential proxy.');
        }
        const aid = this.config.tiktok.appId;
        const region = appContext?.region ?? this.config.tiktok.region;
        const webId = appContext?.wid ?? SessionService_1.generateWebId();
        if (!appContext?.wid) {
            this.logger.warn('The page did not expose a `wid`. Falling back to a locally generated ' +
                'device id, which the edge is unlikely to accept.');
        }
        const bootstrapUrl = this.buildUrl('/api/recommend/item_list/', {
            aid: String(aid),
            count: '10',
            app_name: this.config.tiktok.appName,
            device_platform: this.config.tiktok.devicePlatform,
            device_id: webId,
            region,
            priority_region: region,
        });
        await this.collect(bootstrapUrl, cookies, 'msToken bootstrap', 'application/json, text/plain, */*');
        if (!cookies['msToken']) {
            this.logger.warn('TikTok did not issue an msToken during bootstrap. Content endpoints ' +
                'will most likely answer with an empty 200 until one is obtained.');
        }
        const session = {
            cookies,
            cookieHeader: SessionService_1.serialiseCookies(cookies),
            webId,
            aid,
            region,
            odinId: appContext?.odinId,
            nonce: appContext?.nonce,
            csrfToken: appContext?.csrfToken ?? cookies['tt_csrf_token'],
            botType: appContext?.botType,
            abTestVersions: appContext?.abTestVersions,
            msToken: cookies['msToken'],
            ttwid: cookies['ttwid'],
            identityFromPage: Boolean(appContext?.wid),
            createdAt: now,
            expiresAt: now + this.config.session.ttlMs,
            requestCount: 0,
        };
        this.current = session;
        this.logger.log(`Session bootstrapped (wid=${webId}, aid=${aid}, region=${region}, ` +
            `cookies=${Object.keys(cookies).join(',')}, ` +
            `msToken=${session.msToken ? `${session.msToken.length} chars` : 'absent'}, ` +
            `identityFromPage=${session.identityFromPage})`);
        return session;
    }
    async registerDevice(cookies) {
        const url = `${this.config.tiktok.origin}/ttwid/union/register/`;
        try {
            const response = await this.http.send(url, {
                method: 'POST',
                body: JSON.stringify({
                    region: this.config.tiktok.region,
                    aid: this.config.tiktok.appId,
                    needFid: false,
                    service: 'www.tiktok.com',
                    migrate_info: { ticket: '', source: 'node' },
                    cbUrlProtocol: 'https',
                    union: true,
                }),
                headers: {
                    'User-Agent': this.config.tiktok.userAgent,
                    'Content-Type': 'application/json',
                    Accept: '*/*',
                },
            });
            for (const [name, value] of SessionService_1.readSetCookies(response.headers)) {
                if (value)
                    cookies[name] = value;
            }
            const body = response.body.toString('utf8');
            this.logger.debug(`device registration: HTTP ${response.status}, ttwid=${cookies['ttwid'] ? 'set' : 'absent'}, ${body.slice(0, 80)}`);
        }
        catch (error) {
            this.logger.warn(`Device registration failed; falling back to the cookie a page load sets: ` +
                `${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async loadIdentity(cookies) {
        const paths = ['/explore', '/', '/foryou'];
        let fallbackTtwid;
        const errors = [];
        for (const path of paths) {
            try {
                const html = await this.collect(`${this.config.tiktok.origin}${path}`, cookies, `identity bootstrap ${path}`, 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
                const ttwid = cookies['ttwid'];
                if (ttwid && !fallbackTtwid)
                    fallbackTtwid = ttwid;
                const appContext = html ? (0, app_context_1.parseAppContext)(html) : undefined;
                if (appContext?.wid) {
                    return { appContext, ttwid };
                }
                errors.push(`${path}: no app-context`);
            }
            catch (error) {
                errors.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        this.logger.warn(`Could not obtain an app context (${errors.join('; ')})`);
        return { appContext: undefined, ttwid: fallbackTtwid };
    }
    async collect(url, jar, label, accept) {
        let response;
        try {
            response = await this.http.send(url, {
                headers: {
                    'User-Agent': this.config.tiktok.userAgent,
                    Accept: accept,
                    'Accept-Language': `${this.config.tiktok.language}-${this.config.tiktok.region},${this.config.tiktok.language};q=0.9`,
                    'Accept-Encoding': 'gzip, deflate, br',
                    Referer: `${this.config.tiktok.origin}/`,
                    ...(Object.keys(jar).length ? { Cookie: SessionService_1.serialiseCookies(jar) } : {}),
                },
            });
        }
        catch (error) {
            throw new tiktok_errors_1.SessionBootstrapError(`Session bootstrap request failed during ${label}.`, { url, cause: error instanceof Error ? error.message : String(error) }, 'Check outbound connectivity and any configured proxy.');
        }
        if (response.status >= 400) {
            throw new tiktok_errors_1.SessionBootstrapError(`Session bootstrap hit HTTP ${response.status} during ${label}.`, { url, upstreamStatus: response.status, body: response.body.toString('utf8').slice(0, 300) });
        }
        const setCookies = SessionService_1.readSetCookies(response.headers);
        for (const [name, value] of setCookies) {
            if (value === '')
                continue;
            jar[name] = value;
        }
        this.logger.debug(`${label}: HTTP ${response.status}, +${setCookies.length} cookie(s)`);
        return response.body.toString('utf8');
    }
    buildUrl(path, query) {
        const params = new URLSearchParams(query);
        return `${this.config.tiktok.origin}${path}?${params.toString()}`;
    }
    static readSetCookies(headers) {
        const raw = headers['set-cookie'];
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const out = [];
        for (const entry of list) {
            const first = entry.split(';', 1)[0];
            const eq = first.indexOf('=');
            if (eq <= 0)
                continue;
            out.push([first.slice(0, eq).trim(), first.slice(eq + 1).trim()]);
        }
        return out;
    }
    static serialiseCookies(cookies) {
        return Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');
    }
    static generateWebId() {
        let id = '7';
        for (let i = 0; i < 18; i++)
            id += String((0, crypto_1.randomInt)(0, 10));
        return id;
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = SessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(configuration_1.CONFIG)),
    __metadata("design:paramtypes", [Object, http_client_1.HttpClient])
], SessionService);
//# sourceMappingURL=session.service.js.map