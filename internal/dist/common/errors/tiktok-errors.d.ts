export type TiktokErrorKind = 'SESSION_BOOTSTRAP_FAILED' | 'UPSTREAM_UNREACHABLE' | 'UPSTREAM_TIMEOUT' | 'UPSTREAM_HTTP_ERROR' | 'UPSTREAM_REJECTED' | 'UPSTREAM_THROTTLED' | 'UPSTREAM_BLOCKED' | 'UPSTREAM_RATE_LIMITED' | 'UPSTREAM_MALFORMED' | 'NOT_FOUND' | 'BAD_REQUEST' | 'INTERNAL';
export interface TiktokErrorDetails {
    statusCode?: number;
    statusMessage?: string;
    logId?: string;
    url?: string;
    upstreamStatus?: number;
    body?: string;
    signed?: boolean;
    sessionAttached?: boolean;
    [key: string]: unknown;
}
export interface TiktokErrorPayload {
    kind: TiktokErrorKind;
    message: string;
    statusCode: number;
    details: TiktokErrorDetails;
    hint?: string;
}
export declare class TiktokError extends Error {
    readonly kind: TiktokErrorKind;
    readonly httpStatus: number;
    readonly details: TiktokErrorDetails;
    readonly hint?: string;
    constructor(kind: TiktokErrorKind, message: string, httpStatus: number, details?: TiktokErrorDetails, hint?: string);
    toPayload(): TiktokErrorPayload;
}
export declare class SessionBootstrapError extends TiktokError {
    constructor(message: string, details?: TiktokErrorDetails, hint?: string);
}
export declare class UpstreamUnreachableError extends TiktokError {
    constructor(message: string, details?: TiktokErrorDetails, hint?: string);
}
export declare class UpstreamTimeoutError extends TiktokError {
    constructor(message: string, details?: TiktokErrorDetails, hint?: string);
}
export declare class UpstreamHttpError extends TiktokError {
    constructor(message: string, details?: TiktokErrorDetails, hint?: string);
}
export declare class UpstreamRejectedError extends TiktokError {
    constructor(message: string, details?: TiktokErrorDetails, hint?: string);
}
export declare class UpstreamMalformedError extends TiktokError {
    constructor(message: string, details?: TiktokErrorDetails, hint?: string);
}
export declare class UpstreamRateLimitedError extends TiktokError {
    constructor(message: string, details?: TiktokErrorDetails, hint?: string);
}
export declare class UpstreamThrottledError extends TiktokError {
    constructor(message: string, details?: TiktokErrorDetails, hint?: string);
}
export declare class UpstreamBlockedError extends TiktokError {
    constructor(message: string, details?: TiktokErrorDetails, hint?: string);
}
export declare class NotFoundError extends TiktokError {
    constructor(message: string, details?: TiktokErrorDetails, hint?: string);
}
export declare class BadRequestError extends TiktokError {
    constructor(message: string, details?: TiktokErrorDetails, hint?: string);
}
export declare const isTiktokError: (e: unknown) => e is TiktokError;
