export declare const DEFAULT_USER_AGENT: string;
export interface AppConfig {
    server: {
        port: number;
        host: string;
    };
    tiktok: {
        origin: string;
        region: string;
        language: string;
        browserLanguage: string;
        appName: string;
        appId: number;
        devicePlatform: string;
        proxyUrl?: string;
        timeoutMs: number;
        maxRetries: number;
        retryBaseDelayMs: number;
        userAgent: string;
        transport: 'undici' | 'tls';
        tlsClientIdentifier: string;
        pythonPath?: string;
        minRequestIntervalMs: number;
        maxConcurrentRequests: number;
        retryOnThrottle: boolean;
        throttleBackoffBaseMs: number;
        http2: boolean;
        signerSdkVersion?: string;
        signerScmVersion?: string;
    };
    session: {
        ttlMs: number;
        maxRequestsPerSession: number;
    };
}
export declare function loadConfig(env?: NodeJS.ProcessEnv): AppConfig;
export declare const CONFIG = "APP_CONFIG";
