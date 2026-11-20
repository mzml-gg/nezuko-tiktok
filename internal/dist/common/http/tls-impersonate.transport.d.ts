import { OnModuleDestroy } from '@nestjs/common';
import { type AppConfig } from '../../config/configuration';
export interface ImpersonatedRequest {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string;
    timeoutMs?: number;
}
export interface ImpersonatedResponse {
    status: number;
    headers: Record<string, string>;
    body: Buffer;
}
export type ImpersonationBackend = 'node-tls-client' | 'curl_cffi' | 'none';
export interface BackendStatus {
    name: ImpersonationBackend;
    available: boolean;
    reason?: string;
}
export declare class TlsImpersonateTransport implements OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private readonly backends;
    private chosen;
    private tls;
    private session;
    private child;
    private buffer;
    private nextId;
    private readonly pending;
    private starting;
    constructor(config: AppConfig);
    get enabled(): boolean;
    get backend(): ImpersonationBackend;
    get status(): BackendStatus[];
    tryRequest(request: ImpersonatedRequest): Promise<ImpersonatedResponse | null>;
    onModuleDestroy(): Promise<void>;
    private ensureStarted;
    private select;
    private tryAddon;
    private tryBridge;
    private probe;
    private accept;
    private reject;
    private requestViaAddon;
    private requestViaBridge;
    private bridgeCall;
    private consumeBridge;
    private settleBridge;
    private failPending;
    private static resolveBridgeScript;
    private static flatten;
}
