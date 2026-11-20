"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var HttpClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const common_1 = require("@nestjs/common");
const zlib = __importStar(require("zlib"));
const undici_1 = require("undici");
const tls_impersonate_transport_1 = require("./tls-impersonate.transport");
const configuration_1 = require("../../config/configuration");
const tiktok_errors_1 = require("../errors/tiktok-errors");
const CHROME_TLS = {
    ciphers: [
        'TLS_AES_128_GCM_SHA256',
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305',
        'ECDHE-RSA-AES128-SHA',
        'ECDHE-RSA-AES256-SHA',
        'AES128-GCM-SHA256',
        'AES256-GCM-SHA384',
    ].join(':'),
    sigalgs: [
        'ecdsa_secp256r1_sha256',
        'rsa_pss_rsae_sha256',
        'rsa_pkcs1_sha256',
        'ecdsa_secp384r1_sha384',
        'rsa_pss_rsae_sha384',
        'rsa_pkcs1_sha384',
        'rsa_pss_rsae_sha512',
        'rsa_pkcs1_sha512',
    ].join(':'),
    ecdhCurve: 'X25519:P-256:P-384',
    ALPNProtocols: ['h2', 'http/1.1'],
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
};
let HttpClient = HttpClient_1 = class HttpClient {
    config;
    logger = new common_1.Logger(HttpClient_1.name);
    transportWarned = false;
    dispatcher;
    impersonator;
    constructor(config, impersonator) {
        this.config = config;
        this.impersonator = impersonator ?? new tls_impersonate_transport_1.TlsImpersonateTransport(config);
        this.dispatcher = HttpClient_1.createDispatcher(config.tiktok.proxyUrl, config.tiktok.http2);
        this.logger.log(config.tiktok.transport === 'tls'
            ? 'Transport: tls (Chrome ClientHello via node-tls-client).'
            : 'Transport: undici (Node/OpenSSL ClientHello). Six API paths will refuse ' +
                'this handshake; set TIKTOK_TRANSPORT=tls to reach them.');
        if (config.tiktok.proxyUrl) {
            const redacted = config.tiktok.proxyUrl.replace(/\/\/[^@]*@/, '//***@');
            this.logger.log(`Upstream proxy enabled: ${redacted}`);
        }
    }
    static createDispatcher(proxyUrl, http2) {
        if (proxyUrl) {
            return new undici_1.ProxyAgent({
                uri: proxyUrl,
                connections: 8,
                pipelining: 1,
                allowH2: http2,
                connect: CHROME_TLS,
            });
        }
        return new undici_1.Agent({
            connections: 16,
            pipelining: 1,
            allowH2: http2,
            keepAliveTimeout: 30_000,
            keepAliveMaxTimeout: 60_000,
            connect: CHROME_TLS,
        });
    }
    get impersonatorStatus() {
        const backend = this.impersonator.backend;
        return {
            inUse: backend === 'none' ? 'undici' : 'tls',
            backend,
            backends: this.impersonator.status,
        };
    }
    async send(url, options = {}) {
        const started = Date.now();
        const timeout = options.timeoutMs ?? this.config.tiktok.timeoutMs;
        if (this.impersonator.enabled) {
            const answer = await this.impersonator.tryRequest({
                method: options.method ?? 'GET',
                url,
                headers: options.headers,
                body: typeof options.body === 'string' ? options.body : options.body?.toString(),
                timeoutMs: timeout,
            });
            if (answer) {
                return {
                    status: answer.status,
                    headers: answer.headers,
                    body: answer.body,
                    elapsedMs: Date.now() - started,
                };
            }
            if (!this.transportWarned) {
                this.transportWarned = true;
                this.logger.warn('No Chrome-shaped transport is available, so undici is carrying requests. ' +
                    'The six paths that check the handshake will answer an empty body. ' +
                    'See /internal/health for the reason each backend was rejected.');
            }
        }
        const response = await (0, undici_1.request)(url, {
            method: (options.method ?? 'GET'),
            headers: options.headers,
            body: options.body,
            dispatcher: options.dispatcher ?? this.dispatcher,
            headersTimeout: timeout,
            bodyTimeout: timeout,
            maxRedirections: 3,
        });
        const chunks = [];
        for await (const chunk of response.body) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const headers = response.headers;
        const raw = Buffer.concat(chunks);
        return {
            status: response.statusCode,
            headers,
            body: await HttpClient_1.decompress(raw, headers),
            elapsedMs: Date.now() - started,
        };
    }
    static async decompress(body, headers) {
        if (body.length === 0)
            return body;
        const raw = headers['content-encoding'];
        const encoding = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase();
        if (!encoding || encoding === 'identity')
            return body;
        const decode = (fn) => new Promise((resolve, reject) => {
            fn(body, (error, result) => (error ? reject(error) : resolve(result)));
        });
        try {
            switch (encoding) {
                case 'gzip':
                case 'x-gzip':
                    return await decode(zlib.gunzip.bind(zlib));
                case 'deflate':
                    return await decode(zlib.inflate.bind(zlib));
                case 'br':
                    return await decode(zlib.brotliDecompress.bind(zlib));
                case 'zstd':
                    if (typeof zlib.zstdDecompress === 'function') {
                        return await decode(zlib.zstdDecompress.bind(zlib));
                    }
                    throw new Error('zstd responses are not supported by this Node build');
                default:
                    return body;
            }
        }
        catch (error) {
            throw new tiktok_errors_1.UpstreamMalformedError(`Could not decode a "${encoding}" response body.`, { contentEncoding: encoding, bytes: body.length, cause: error instanceof Error ? error.message : String(error) });
        }
    }
    async onModuleDestroy() {
        await this.close();
    }
    async close() {
        await this.dispatcher.close();
    }
};
exports.HttpClient = HttpClient;
exports.HttpClient = HttpClient = HttpClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(configuration_1.CONFIG)),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, tls_impersonate_transport_1.TlsImpersonateTransport])
], HttpClient);
//# sourceMappingURL=http-client.js.map