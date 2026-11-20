"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTiktokError = exports.BadRequestError = exports.NotFoundError = exports.UpstreamBlockedError = exports.UpstreamThrottledError = exports.UpstreamRateLimitedError = exports.UpstreamMalformedError = exports.UpstreamRejectedError = exports.UpstreamHttpError = exports.UpstreamTimeoutError = exports.UpstreamUnreachableError = exports.SessionBootstrapError = exports.TiktokError = void 0;
const common_1 = require("@nestjs/common");
class TiktokError extends Error {
    kind;
    httpStatus;
    details;
    hint;
    constructor(kind, message, httpStatus, details = {}, hint) {
        super(message);
        this.name = new.target.name;
        this.kind = kind;
        this.httpStatus = httpStatus;
        this.details = details;
        this.hint = hint;
        Error.captureStackTrace?.(this, new.target);
    }
    toPayload() {
        return {
            kind: this.kind,
            message: this.message,
            statusCode: this.httpStatus,
            details: this.details,
            ...(this.hint ? { hint: this.hint } : {}),
        };
    }
}
exports.TiktokError = TiktokError;
class SessionBootstrapError extends TiktokError {
    constructor(message, details = {}, hint) {
        super('SESSION_BOOTSTRAP_FAILED', message, common_1.HttpStatus.BAD_GATEWAY, details, hint);
    }
}
exports.SessionBootstrapError = SessionBootstrapError;
class UpstreamUnreachableError extends TiktokError {
    constructor(message, details = {}, hint) {
        super('UPSTREAM_UNREACHABLE', message, common_1.HttpStatus.BAD_GATEWAY, details, hint);
    }
}
exports.UpstreamUnreachableError = UpstreamUnreachableError;
class UpstreamTimeoutError extends TiktokError {
    constructor(message, details = {}, hint) {
        super('UPSTREAM_TIMEOUT', message, common_1.HttpStatus.GATEWAY_TIMEOUT, details, hint);
    }
}
exports.UpstreamTimeoutError = UpstreamTimeoutError;
class UpstreamHttpError extends TiktokError {
    constructor(message, details = {}, hint) {
        super('UPSTREAM_HTTP_ERROR', message, common_1.HttpStatus.BAD_GATEWAY, details, hint);
    }
}
exports.UpstreamHttpError = UpstreamHttpError;
class UpstreamRejectedError extends TiktokError {
    constructor(message, details = {}, hint) {
        super('UPSTREAM_REJECTED', message, common_1.HttpStatus.BAD_GATEWAY, details, hint);
    }
}
exports.UpstreamRejectedError = UpstreamRejectedError;
class UpstreamMalformedError extends TiktokError {
    constructor(message, details = {}, hint) {
        super('UPSTREAM_MALFORMED', message, common_1.HttpStatus.BAD_GATEWAY, details, hint);
    }
}
exports.UpstreamMalformedError = UpstreamMalformedError;
class UpstreamRateLimitedError extends TiktokError {
    constructor(message, details = {}, hint) {
        super('UPSTREAM_RATE_LIMITED', message, common_1.HttpStatus.TOO_MANY_REQUESTS, details, hint);
    }
}
exports.UpstreamRateLimitedError = UpstreamRateLimitedError;
const THROTTLE_HINT = 'TikTok did not return content. Three upstream shapes look identical from ' +
    'here and only one of them is a rate limit, so read the `transport` field on ' +
    '/internal/health before acting on this.\n' +
    '\n' +
    '  * If `transport.name` is not `tls`, this is almost certainly the TLS ' +
    'handshake: six API paths refuse a ClientHello that is not Chrome\'s, and ' +
    'they answer an empty body with `tt_orcas_res: 1` - byte for byte what a ' +
    'throttled edge sends. Restart with `TIKTOK_TRANSPORT=tls` and retry once ' +
    'before changing any pacing.\n' +
    '  * If `transport.name` is `tls`, the handshake was Chrome-shaped and this ' +
    'is the rate limit: TikTok applies per-IP overload protection and answers ' +
    'every request identically regardless of how it was signed, which is why ' +
    '`503 overload-protect triggered` and an empty 200 look the same. Raise ' +
    'TIKTOK_MIN_REQUEST_INTERVAL_MS, lower TIKTOK_MAX_CONCURRENT_REQUESTS, or ' +
    'wait for the window to clear.\n' +
    '\n' +
    'A throttled edge can also be a signed-out one: over-repeated requests on a ' +
    'single identity look the same as a busy IP. Restart the process for a fresh ' +
    'session if the window does not clear.';
class UpstreamThrottledError extends TiktokError {
    constructor(message, details = {}, hint = THROTTLE_HINT) {
        super('UPSTREAM_THROTTLED', message, common_1.HttpStatus.TOO_MANY_REQUESTS, details, hint);
    }
}
exports.UpstreamThrottledError = UpstreamThrottledError;
const BLOCK_HINT = 'TikTok answered 200 OK with an empty body after every retry, and the ' +
    'response carried no throttle marker. That means the edge served a challenge ' +
    'or refused the client outright rather than pacing it. Check details.body for ' +
    'a WAF interstitial, and details.ticketGuardResult / details.orcas for the ' +
    "edge's verdict.";
class UpstreamBlockedError extends TiktokError {
    constructor(message, details = {}, hint = BLOCK_HINT) {
        super('UPSTREAM_BLOCKED', message, common_1.HttpStatus.BAD_GATEWAY, details, hint);
    }
}
exports.UpstreamBlockedError = UpstreamBlockedError;
class NotFoundError extends TiktokError {
    constructor(message, details = {}, hint) {
        super('NOT_FOUND', message, common_1.HttpStatus.NOT_FOUND, details, hint);
    }
}
exports.NotFoundError = NotFoundError;
class BadRequestError extends TiktokError {
    constructor(message, details = {}, hint) {
        super('BAD_REQUEST', message, common_1.HttpStatus.BAD_REQUEST, details, hint);
    }
}
exports.BadRequestError = BadRequestError;
const isTiktokError = (e) => e instanceof TiktokError;
exports.isTiktokError = isTiktokError;
//# sourceMappingURL=tiktok-errors.js.map