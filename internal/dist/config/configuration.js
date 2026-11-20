"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = exports.DEFAULT_USER_AGENT = void 0;
exports.loadConfig = loadConfig;
exports.DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
function num(value, fallback) {
    if (value === undefined || value.trim() === '')
        return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`Expected a numeric environment value but received "${value}"`);
    }
    return parsed;
}
function str(value, fallback) {
    return value === undefined || value.trim() === '' ? fallback : value.trim();
}
function optional(value) {
    const v = value?.trim();
    return v ? v : undefined;
}
function bool(value, fallback) {
    if (value === undefined || value.trim() === '')
        return fallback;
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}
function loadConfig(env = process.env) {
    return {
        server: {
            port: num(env.PORT, 3000),
            host: str(env.HOST, '0.0.0.0'),
        },
        tiktok: {
            origin: str(env.TIKTOK_ORIGIN, 'https://www.tiktok.com'),
            region: str(env.TIKTOK_REGION, 'US'),
            language: str(env.TIKTOK_LANGUAGE, 'en'),
            browserLanguage: str(env.TIKTOK_BROWSER_LANGUAGE, 'en-US'),
            appName: str(env.TIKTOK_APP_NAME, 'tiktok_web'),
            appId: num(env.TIKTOK_APP_ID, 1988),
            devicePlatform: str(env.TIKTOK_DEVICE_PLATFORM, 'web_pc'),
            proxyUrl: optional(env.TIKTOK_PROXY_URL),
            timeoutMs: num(env.TIKTOK_TIMEOUT_MS, 15_000),
            maxRetries: num(env.TIKTOK_MAX_RETRIES, 2),
            retryBaseDelayMs: num(env.TIKTOK_RETRY_BASE_DELAY_MS, 400),
            userAgent: str(env.TIKTOK_USER_AGENT, exports.DEFAULT_USER_AGENT),
            transport: env.TIKTOK_TRANSPORT === 'undici' ? 'undici' : 'tls',
            tlsClientIdentifier: str(env.TIKTOK_TLS_CLIENT, 'chrome_131'),
            pythonPath: str(env.TIKTOK_PYTHON, 'python3'),
            signerSdkVersion: optional(env.TIKTOK_SIGNER_SDK_VERSION),
            signerScmVersion: optional(env.TIKTOK_SIGNER_SCM_VERSION),
            minRequestIntervalMs: num(env.TIKTOK_MIN_REQUEST_INTERVAL_MS, 400),
            maxConcurrentRequests: num(env.TIKTOK_MAX_CONCURRENT_REQUESTS, 2),
            retryOnThrottle: bool(env.TIKTOK_RETRY_ON_THROTTLE, true),
            throttleBackoffBaseMs: num(env.TIKTOK_THROTTLE_BACKOFF_BASE_MS, 1_500),
            http2: bool(env.TIKTOK_HTTP2, true),
        },
        session: {
            ttlMs: num(env.TIKTOK_SESSION_TTL_MS, 10 * 60 * 1000),
            maxRequestsPerSession: num(env.TIKTOK_SESSION_MAX_REQUESTS, 200),
        },
    };
}
exports.CONFIG = 'APP_CONFIG';
//# sourceMappingURL=configuration.js.map