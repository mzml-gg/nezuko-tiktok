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
var TiktokClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TiktokClient = void 0;
const common_1 = require("@nestjs/common");
const configuration_1 = require("../config/configuration");
const http_client_1 = require("../common/http/http-client");
const session_service_1 = require("../session/session.service");
const tiktok_errors_1 = require("../common/errors/tiktok-errors");
const rate_limiter_1 = require("../common/http/rate-limiter");
const tiktok_sign_1 = require("../signer/tiktok-sign");
let TiktokClient = TiktokClient_1 = class TiktokClient {
    config;
    http;
    session;
    rateLimiter;
    logger = new common_1.Logger(TiktokClient_1.name);
    constructor(config, http, session, rateLimiter) {
        this.config = config;
        this.http = http;
        this.session = session;
        this.rateLimiter = rateLimiter;
    }
    async request(request) {
        const attempts = this.config.tiktok.maxRetries + 1;
        let lastError;
        for (let attempt = 1; attempt <= attempts; attempt++) {
            let context;
            try {
                context = await this.prepare(request);
            }
            catch (error) {
                throw error;
            }
            try {
                const response = await this.rateLimiter.run(() => this.http.send(context.signedUrl, {
                    method: request.method ?? 'GET',
                    body: request.body,
                    headers: this.buildHeaders(request, context),
                }));
                if (response.status === 429) {
                    this.rateLimiter.penalise(TiktokClient_1.retryAfterMs(response.headers) ?? this.config.tiktok.throttleBackoffBaseMs);
                }
                return this.interpret(request, context, response.status, response.headers, response.body, response.elapsedMs, attempt);
            }
            catch (error) {
                lastError = error;
                if (!TiktokClient_1.isRetryable(error) || attempt === attempts) {
                    throw TiktokClient_1.normaliseTransportError(error, context);
                }
                if (error instanceof tiktok_errors_1.UpstreamThrottledError && attempt === 1) {
                    this.session.invalidate(`throttled on ${request.path}`);
                }
                const delay = TiktokClient_1.retryDelay(error, this.config, attempt);
                this.rateLimiter.penalise(delay);
                this.logger.warn(`Attempt ${attempt}/${attempts} for ${request.path} throttled/failed ` +
                    `(${TiktokClient_1.message(error)}); retrying in ${delay}ms`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw TiktokClient_1.normaliseTransportError(lastError, undefined);
    }
    async get(path, query, extra = {}) {
        return this.request({ ...extra, path, query, method: 'GET' });
    }
    async prepare(request) {
        const session = await this.session.get();
        const origin = this.config.tiktok.origin;
        if (request.sign === false) {
            const pairs = this.buildPairs(request, session);
            const query = pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
            return {
                session,
                signedUrl: query ? `${origin}${request.path}?${query}` : `${origin}${request.path}`,
                signatureMs: 0,
                signatureApplied: false,
            };
        }
        const started = Date.now();
        const pairs = this.buildPairs(request, session);
        const signed = (0, tiktok_sign_1.signRequest)(pairs, {
            userAgent: this.config.tiktok.userAgent,
            msToken: session.msToken ?? '',
            sdkVersion: this.config.tiktok.signerSdkVersion ?? tiktok_sign_1.DEFAULT_SDK_VERSION,
            scmVersion: this.config.tiktok.signerScmVersion ?? tiktok_sign_1.DEFAULT_SCM_VERSION,
            envCode: request.envCode,
            ubCode: request.ubCode,
        });
        return {
            session,
            signedUrl: `${origin}${request.path}?${signed.query}`,
            signatureMs: Date.now() - started,
            signatureApplied: true,
        };
    }
    static truncatedAppVersion(userAgent) {
        const match = /Mozilla\/([\d.]+) \(([^;)]+)/.exec(userAgent);
        if (!match)
            return userAgent;
        return `${match[1]} (${match[2].trim().split(/\s+/)[0]})`;
    }
    buildPairs(request, session) {
        const pairs = [];
        if (!request.bare) {
            const common = this.commonParams(session);
            for (const [key, value] of Object.entries(common)) {
                if (value !== undefined && value !== null && value !== '')
                    pairs.push([key, String(value)]);
            }
        }
        const keepEmpty = new Set(request.keepEmpty ?? []);
        for (const [key, value] of Object.entries(request.query ?? {})) {
            if (value === undefined || value === null)
                continue;
            if (value === '' && !keepEmpty.has(key))
                continue;
            pairs.push([key, Array.isArray(value) ? value.join(',') : String(value)]);
        }
        if (!pairs.some(([key]) => key === 'clientABVersions') &&
            this.abVersionsPaths.has(request.path) &&
            session.abTestVersions) {
            pairs.push(['clientABVersions', session.abTestVersions]);
        }
        return pairs;
    }
    abVersionsPaths = new Set([
        '/api/challenge/item_list/',
        '/api/collection/item_list/',
        '/api/creator/item_list/',
        '/api/favorite/item_list/',
        '/api/following/item_list/',
        '/api/friends/item_list/',
        '/api/mix/item_list/',
        '/api/poi/item_list/',
        '/api/post/item_list/',
        '/api/post/item_list/v1/',
        '/api/question/item_list/',
        '/api/recommend/item_list/',
        '/api/topic/item_list/',
        '/api/user/collect/item_list/',
    ]);
    commonParams(session) {
        const cfg = this.config.tiktok;
        const userAgentForQuery = cfg.userAgent;
        const nowSeconds = Math.floor(Date.now() / 1000);
        const region = session.region || cfg.region;
        const params = {
            aid: String(cfg.appId),
            app_name: cfg.appName,
            app_language: cfg.language,
            device_platform: cfg.devicePlatform,
            device_id: session.webId,
            region,
            priority_region: region,
            language: cfg.language,
            WebIdLastTime: String(nowSeconds),
            channel: 'tiktok_web',
            cookie_enabled: 'true',
            os: 'mac',
            browser_language: cfg.browserLanguage,
            browser_name: 'Mozilla',
            browser_online: 'true',
            browser_platform: 'MacIntel',
            browser_version: TiktokClient_1.truncatedAppVersion(userAgentForQuery),
            focus_state: 'true',
            is_fullscreen: 'false',
            is_page_visible: 'true',
            history_len: '3',
            screen_height: '1117',
            screen_width: '1728',
            tz_name: Intl.DateTimeFormat().resolvedOptions().timeZone,
            webcast_language: cfg.language,
            referer: '',
            root_referer: `${cfg.origin}/`,
        };
        return params;
    }
    buildHeaders(request, context) {
        const cfg = this.config.tiktok;
        const headers = {
            'User-Agent': cfg.userAgent,
            Accept: 'application/json, text/plain, */*',
            'Accept-Language': `${cfg.language}-${cfg.region},${cfg.language};q=0.9`,
            'Accept-Encoding': 'gzip, deflate, br',
            Referer: request.referer ?? `${cfg.origin}/`,
            Origin: cfg.origin,
            'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            priority: 'u=1, i',
            Cookie: context.session.cookieHeader,
        };
        if (context.session.csrfToken) {
            headers['x-secsdk-csrf-token'] = context.session.csrfToken;
        }
        return { ...headers, ...(request.headers ?? {}) };
    }
    interpret(request, context, status, headers, body, elapsedMs, attempt) {
        const raw = body.toString('utf8');
        const logId = TiktokClient_1.header(headers, 'x-tt-logid');
        const ticketGuardResult = TiktokClient_1.numericHeader(headers, 'tt-ticket-guard-result');
        const signature = { applied: context.signatureApplied, ms: context.signatureMs };
        const overloaded = TiktokClient_1.isOverloadResponse(status, raw);
        if (status === 429 || overloaded) {
            throw new tiktok_errors_1.UpstreamThrottledError(`TikTok throttled the request to ${request.path} (HTTP ${status}${overloaded ? ', overload-protect' : ''}).`, {
                url: context.signedUrl,
                logId,
                upstreamStatus: status,
                signed: signature.applied,
                body: raw.slice(0, 300),
                retryAfterMs: TiktokClient_1.retryAfterMs(headers),
            });
        }
        if (status >= 500) {
            throw new tiktok_errors_1.UpstreamHttpError(`TikTok returned HTTP ${status} for ${request.path}.`, {
                url: context.signedUrl,
                logId,
                upstreamStatus: status,
                body: raw.slice(0, 500),
                signed: signature.applied,
                sessionAttached: Boolean(context.session.cookieHeader),
            });
        }
        if (raw.length === 0) {
            if (request.allowEmpty) {
                return {
                    status,
                    logId,
                    data: undefined,
                    raw,
                    url: context.signedUrl,
                    elapsedMs,
                    attempts: attempt,
                    ticketGuardResult,
                    signature,
                };
            }
            throw new tiktok_errors_1.UpstreamThrottledError(`TikTok answered HTTP ${status} with an empty body for ${request.path}` +
                (ticketGuardResult === 0 ? ' (tt-ticket-guard-result: 0).' : '.'), {
                url: context.signedUrl,
                logId,
                upstreamStatus: status,
                signed: signature.applied,
                sessionAttached: Boolean(context.session.cookieHeader),
                ticketGuardResult,
                orcas: TiktokClient_1.numericHeader(headers, 'tt_orcas_res'),
                msTokenPresent: Boolean(context.session.msToken),
                deviceIdFromPage: context.session.identityFromPage,
            });
        }
        let data;
        const isJson = TiktokClient_1.header(headers, 'content-type')?.includes('json') === true ||
            raw.startsWith('{') ||
            raw.startsWith('[');
        if (!isJson) {
            const looksLikeChallenge = /wafchallengeid|_wafchallengeid|Please wait/i.test(raw);
            if (looksLikeChallenge) {
                throw new tiktok_errors_1.UpstreamBlockedError(`TikTok served a WAF challenge page instead of JSON for ${request.path}.`, {
                    url: context.signedUrl,
                    logId,
                    upstreamStatus: status,
                    body: raw.slice(0, 500),
                    signed: signature.applied,
                    ticketGuardResult,
                }, 'This egress IP has been flagged by the edge. A different network or a ' +
                    'residential proxy (TIKTOK_PROXY_URL) is required.');
            }
            if (status >= 400) {
                throw new tiktok_errors_1.UpstreamHttpError(`TikTok returned HTTP ${status} with a non-JSON body for ${request.path}.`, { url: context.signedUrl, logId, upstreamStatus: status, body: raw.slice(0, 500) });
            }
            return {
                status,
                logId,
                data: raw,
                raw,
                url: context.signedUrl,
                elapsedMs,
                attempts: attempt,
                ticketGuardResult,
                signature,
            };
        }
        try {
            data = JSON.parse(raw);
        }
        catch (error) {
            throw new tiktok_errors_1.UpstreamMalformedError(`TikTok returned a body that is not valid JSON for ${request.path}.`, {
                url: context.signedUrl,
                logId,
                upstreamStatus: status,
                body: raw.slice(0, 500),
                cause: error instanceof Error ? error.message : String(error),
            });
        }
        const envelope = data;
        const appStatus = TiktokClient_1.appStatusCode(envelope);
        if (appStatus !== undefined && appStatus !== 0 && !request.okStatusCodes?.includes(appStatus)) {
            const appMessage = TiktokClient_1.appStatusMessage(envelope);
            throw new tiktok_errors_1.UpstreamRejectedError(`TikTok rejected ${request.path} with status_code ${appStatus}${appMessage ? `: ${appMessage}` : '.'}`, {
                statusCode: appStatus,
                statusMessage: appMessage,
                url: context.signedUrl,
                logId,
                upstreamStatus: status,
                body: raw.slice(0, 500),
                signed: signature.applied,
            });
        }
        if (request.softBlockDetector?.(data)) {
            const details = {
                url: context.signedUrl,
                logId,
                upstreamStatus: status,
                body: raw.slice(0, 500),
                signed: signature.applied,
                ticketGuardResult,
                orcas: TiktokClient_1.numericHeader(headers, 'tt_orcas_res'),
            };
            if (ticketGuardResult !== undefined) {
                throw new tiktok_errors_1.UpstreamThrottledError(`TikTok answered ${request.path} with an empty payload under its edge guard ` +
                    `(tt-ticket-guard-result: ${ticketGuardResult}).`, details);
            }
            throw new tiktok_errors_1.UpstreamBlockedError(`TikTok answered ${request.path} with a structurally valid but empty payload.`, details);
        }
        return {
            status,
            logId,
            data,
            raw,
            url: context.signedUrl,
            elapsedMs,
            attempts: attempt,
            ticketGuardResult,
            signature,
        };
    }
    static appStatusCode(envelope) {
        const candidates = [envelope['status_code'], envelope['statusCode']];
        for (const candidate of candidates) {
            if (typeof candidate === 'number')
                return candidate;
            if (typeof candidate === 'string' && candidate.trim() !== '' && !Number.isNaN(Number(candidate))) {
                return Number(candidate);
            }
        }
        return undefined;
    }
    static appStatusMessage(envelope) {
        const candidates = [envelope['status_msg'], envelope['statusMessage'], envelope['message']];
        for (const candidate of candidates) {
            if (typeof candidate === 'string' && candidate.trim() !== '')
                return candidate;
        }
        return undefined;
    }
    static isOverloadResponse(status, raw) {
        if (/overload-protect/i.test(raw))
            return true;
        return status === 503 && raw.length === 0;
    }
    static retryAfterMs(headers) {
        const raw = TiktokClient_1.header(headers, 'retry-after');
        if (!raw)
            return undefined;
        const seconds = Number(raw);
        if (Number.isFinite(seconds) && seconds >= 0) {
            return Math.round(seconds * 1000);
        }
        const date = Date.parse(raw);
        if (!Number.isNaN(date)) {
            return Math.max(0, date - Date.now());
        }
        return undefined;
    }
    static isRetryable(error) {
        if (error instanceof tiktok_errors_1.UpstreamThrottledError)
            return true;
        if (error instanceof tiktok_errors_1.UpstreamRateLimitedError)
            return true;
        if (error instanceof tiktok_errors_1.UpstreamHttpError)
            return true;
        if (error instanceof tiktok_errors_1.UpstreamTimeoutError)
            return true;
        if (error instanceof tiktok_errors_1.UpstreamUnreachableError)
            return true;
        return TiktokClient_1.isNetworkError(error);
    }
    static retryDelay(error, config, attempt) {
        const base = error instanceof tiktok_errors_1.UpstreamThrottledError || error instanceof tiktok_errors_1.UpstreamRateLimitedError
            ? config.tiktok.throttleBackoffBaseMs
            : config.tiktok.retryBaseDelayMs;
        const explicit = error?.details?.retryAfterMs;
        if (typeof explicit === 'number' && explicit > 0) {
            return Math.min(explicit, 60_000);
        }
        return TiktokClient_1.backoff(base, attempt);
    }
    static isNetworkError(error) {
        if (!(error instanceof Error))
            return false;
        const code = error.code ?? '';
        const retryableCodes = [
            'ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'ETIMEDOUT', 'EAI_AGAIN',
            'ENOTFOUND', 'ENETUNREACH', 'UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT',
            'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT',
        ];
        if (retryableCodes.some((c) => code === c))
            return true;
        return /socket hang up|other side closed|timeout|timed out|fetch failed/i.test(error.message);
    }
    static normaliseTransportError(error, context) {
        if (error instanceof tiktok_errors_1.UpstreamThrottledError)
            return error;
        if (error instanceof tiktok_errors_1.UpstreamRateLimitedError)
            return error;
        if (error instanceof tiktok_errors_1.UpstreamHttpError)
            return error;
        if (error instanceof tiktok_errors_1.UpstreamBlockedError)
            return error;
        if (error instanceof tiktok_errors_1.UpstreamRejectedError)
            return error;
        const message = TiktokClient_1.message(error);
        const url = context?.signedUrl;
        if (/timeout|timed out|UND_ERR_(HEADERS|BODY|CONNECT)_TIMEOUT/i.test(message)) {
            return new tiktok_errors_1.UpstreamTimeoutError(`TikTok did not respond in time: ${message}`, { url });
        }
        return new tiktok_errors_1.UpstreamUnreachableError(`Could not reach TikTok: ${message}`, { url });
    }
    static backoff(base, attempt) {
        const exponential = base * 2 ** (attempt - 1);
        const jitter = Math.random() * base;
        return Math.round(Math.min(exponential + jitter, 8_000));
    }
    static message(error) {
        return error instanceof Error ? error.message : String(error);
    }
    static header(headers, name) {
        const value = headers[name.toLowerCase()];
        if (Array.isArray(value))
            return value[0];
        return value;
    }
    static numericHeader(headers, name) {
        const raw = TiktokClient_1.header(headers, name);
        if (raw === undefined)
            return undefined;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
};
exports.TiktokClient = TiktokClient;
exports.TiktokClient = TiktokClient = TiktokClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(configuration_1.CONFIG)),
    __metadata("design:paramtypes", [Object, http_client_1.HttpClient,
        session_service_1.SessionService,
        rate_limiter_1.RateLimiter])
], TiktokClient);
//# sourceMappingURL=tiktok.client.js.map