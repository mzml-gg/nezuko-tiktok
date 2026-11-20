import { type AppConfig } from '../config/configuration';
import { HttpClient } from '../common/http/http-client';
export interface SessionSnapshot {
    cookies: Record<string, string>;
    cookieHeader: string;
    webId: string;
    aid: number;
    region: string;
    odinId?: string;
    nonce?: string;
    csrfToken?: string;
    botType?: string;
    abTestVersions?: string;
    msToken?: string;
    ttwid?: string;
    identityFromPage: boolean;
    createdAt: number;
    expiresAt: number;
    requestCount: number;
}
export declare class SessionService {
    private readonly config;
    private readonly http;
    private readonly logger;
    private current?;
    private inflight?;
    constructor(config: AppConfig, http: HttpClient);
    get(): Promise<SessionSnapshot>;
    invalidate(reason: string): void;
    describe(): Omit<SessionSnapshot, 'cookies' | 'cookieHeader'> & {
        cookieNames: string[];
    };
    private isUsable;
    private bootstrap;
    private performBootstrap;
    private registerDevice;
    private loadIdentity;
    private collect;
    private buildUrl;
    static readSetCookies(headers: Record<string, string | string[] | undefined>): Array<[string, string]>;
    static serialiseCookies(cookies: Record<string, string>): string;
    static generateWebId(): string;
}
