import { type AppConfig } from '../config/configuration';
import { HttpClient } from '../common/http/http-client';
import { SessionService } from '../session/session.service';
import { RateLimiter } from '../common/http/rate-limiter';
export type QueryValue = string | number | boolean | undefined | null | ReadonlyArray<string | number>;
export interface TiktokRequest {
    path: string;
    query?: Record<string, QueryValue>;
    headers?: Record<string, string>;
    referer?: string;
    method?: 'GET' | 'POST';
    body?: string;
    envCode?: number;
    ubCode?: number;
    keepEmpty?: string[];
    sign?: boolean;
    bare?: boolean;
    allowEmpty?: boolean;
    softBlockDetector?: (payload: unknown) => boolean;
    okStatusCodes?: number[];
}
export interface TiktokResponse<T = unknown> {
    status: number;
    logId?: string;
    data: T;
    raw: string;
    url: string;
    elapsedMs: number;
    attempts: number;
    ticketGuardResult?: number;
    signature: {
        applied: boolean;
        ms: number;
    };
}
export declare class TiktokClient {
    private readonly config;
    private readonly http;
    private readonly session;
    private readonly rateLimiter;
    private readonly logger;
    constructor(config: AppConfig, http: HttpClient, session: SessionService, rateLimiter: RateLimiter);
    request<T = unknown>(request: TiktokRequest): Promise<TiktokResponse<T>>;
    get<T = unknown>(path: string, query?: Record<string, QueryValue>, extra?: Omit<TiktokRequest, 'path' | 'query' | 'method'>): Promise<TiktokResponse<T>>;
    private prepare;
    private static truncatedAppVersion;
    private buildPairs;
    private readonly abVersionsPaths;
    private commonParams;
    private buildHeaders;
    private interpret;
    private static appStatusCode;
    private static appStatusMessage;
    static isOverloadResponse(status: number, raw: string): boolean;
    static retryAfterMs(headers: Record<string, string | string[] | undefined>): number | undefined;
    private static isRetryable;
    private static retryDelay;
    private static isNetworkError;
    private static normaliseTransportError;
    private static backoff;
    private static message;
    private static header;
    private static numericHeader;
}
