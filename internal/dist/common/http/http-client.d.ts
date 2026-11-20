import { OnModuleDestroy } from '@nestjs/common';
import { Dispatcher } from 'undici';
import { TlsImpersonateTransport } from './tls-impersonate.transport';
import { type AppConfig } from '../../config/configuration';
export interface HttpRequestOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: string | Buffer;
    timeoutMs?: number;
    dispatcher?: Dispatcher;
}
export interface HttpResponse {
    status: number;
    headers: Record<string, string | string[] | undefined>;
    body: Buffer;
    elapsedMs: number;
}
export declare class HttpClient implements OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private transportWarned;
    private readonly dispatcher;
    private readonly impersonator;
    constructor(config: AppConfig, impersonator?: TlsImpersonateTransport);
    private static createDispatcher;
    get impersonatorStatus(): {
        inUse: 'tls' | 'undici';
        backend: string;
        backends: Array<{
            name: string;
            available: boolean;
            reason?: string;
        }>;
    };
    send(url: string, options?: HttpRequestOptions): Promise<HttpResponse>;
    private static decompress;
    onModuleDestroy(): Promise<void>;
    close(): Promise<void>;
}
