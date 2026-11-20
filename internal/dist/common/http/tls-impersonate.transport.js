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
var TlsImpersonateTransport_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TlsImpersonateTransport = void 0;
const common_1 = require("@nestjs/common");
const node_child_process_1 = require("node:child_process");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const configuration_1 = require("../../config/configuration");
const tiktok_errors_1 = require("../errors/tiktok-errors");
let TlsImpersonateTransport = TlsImpersonateTransport_1 = class TlsImpersonateTransport {
    config;
    logger = new common_1.Logger(TlsImpersonateTransport_1.name);
    backends = [];
    chosen = 'none';
    tls = null;
    session = null;
    child = null;
    buffer = '';
    nextId = 1;
    pending = new Map();
    starting = null;
    constructor(config) {
        this.config = config;
    }
    get enabled() {
        return this.config.tiktok.transport === 'tls';
    }
    get backend() {
        return this.chosen;
    }
    get status() {
        return this.backends.map((entry) => ({ ...entry }));
    }
    async tryRequest(request) {
        if (!this.enabled)
            return null;
        try {
            await this.ensureStarted();
        }
        catch (error) {
            this.logger.warn(`no Chrome-shaped transport is available: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
        if (this.chosen === 'none')
            return null;
        return this.chosen === 'curl_cffi'
            ? this.requestViaBridge(request)
            : this.requestViaAddon(request);
    }
    async onModuleDestroy() {
        if (this.child) {
            try {
                this.child.stdin.write('{"method":"__quit__"}\n');
            }
            catch { }
            this.child.kill();
            this.child = null;
        }
        this.failPending('transport is shutting down');
        try {
            await this.session?.close();
        }
        catch { }
        this.session = null;
        try {
            await this.tls?.destroyTLS();
        }
        catch { }
        this.tls = null;
    }
    async ensureStarted() {
        if (this.chosen !== 'none')
            return;
        if (this.starting)
            return this.starting;
        this.starting = this.select().finally(() => {
            this.starting = null;
        });
        return this.starting;
    }
    async select() {
        if (await this.tryAddon()) {
            this.chosen = 'node-tls-client';
            this.logger.log('Transport: tls via node-tls-client (Chrome ClientHello)');
            return;
        }
        if (await this.tryBridge()) {
            this.chosen = 'curl_cffi';
            this.logger.log('Transport: tls via curl_cffi (Chrome ClientHello, out of process)');
            return;
        }
        this.logger.warn('No Chrome-shaped transport could be started, so undici is carrying requests. ' +
            'The six API paths that check the handshake will answer an empty body. ' +
            'See /internal/health for why each one was rejected.');
    }
    async tryAddon() {
        const name = 'node-tls-client';
        let module;
        try {
            module = require('node-tls-client');
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            const hardened = /Team ID|different Team|code signature/i.test(detail);
            this.reject(name, hardened
                ? 'this Node is signed with the hardened runtime and a Team ID, so macOS ' +
                    'refuses the addon. Run with a normal Node build, or install curl_cffi.'
                : `could not load: ${detail.split('\n')[0].slice(0, 160)}`);
            return false;
        }
        try {
            await module.initTLS();
            this.tls = module;
            this.session = new module.Session({
                clientIdentifier: this.config.tiktok.tlsClientIdentifier,
                timeout: Math.max(1, Math.round(this.config.tiktok.timeoutMs / 1000)),
            });
        }
        catch (error) {
            this.reject(name, `initTLS failed: ${error instanceof Error ? error.message.slice(0, 140) : String(error)}`);
            return false;
        }
        const ok = await this.probe(name, (url) => this.session.get(url, { timeout: 15 }));
        if (ok) {
            this.accept(name);
            return true;
        }
        await this.session?.close().catch(() => undefined);
        this.session = null;
        this.tls = null;
        return false;
    }
    async tryBridge() {
        const name = 'curl_cffi';
        let script;
        try {
            script = TlsImpersonateTransport_1.resolveBridgeScript();
        }
        catch (error) {
            this.reject(name, error instanceof Error ? error.message.slice(0, 160) : String(error));
            return false;
        }
        const python = this.config.tiktok.pythonPath || 'python3';
        const child = (0, node_child_process_1.spawn)(python, ['-u', script], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, PYTHONUNBUFFERED: '1' },
        });
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk) => this.consumeBridge(chunk));
        child.stderr.setEncoding('utf8');
        let stderr = '';
        child.stderr.on('data', (chunk) => {
            const text = String(chunk).trim();
            if (text)
                stderr = (stderr + ' ' + text).slice(-400);
        });
        child.on('exit', (code, signal) => {
            if (this.chosen === 'curl_cffi') {
                this.logger.warn(`curl_cffi bridge exited (code=${code} signal=${signal})`);
            }
            this.child = null;
            this.failPending('curl_cffi bridge exited');
        });
        child.on('error', (error) => {
            this.reject(name, `could not start ${python}: ${error.message}`);
            this.child = null;
        });
        this.child = child;
        const ok = await this.probe(name, (url) => this.bridgeCall({ method: 'GET', url, timeoutMs: 15_000 }));
        if (ok) {
            this.accept(name);
            return true;
        }
        try {
            child.kill();
        }
        catch { }
        this.child = null;
        this.failPending('probe failed');
        const settled = this.backends.find((b) => b.name === name);
        if (settled && !settled.reason && stderr.trim()) {
            settled.reason = stderr.trim().slice(0, 200);
        }
        return false;
    }
    async probe(name, send) {
        const url = `${this.config.tiktok.origin}/`;
        try {
            const answer = await send(url);
            if (answer.status > 0)
                return true;
            this.reject(name, 'the probe request came back with no HTTP status');
            return false;
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            if (!this.backends.some((b) => b.name === name && b.reason)) {
                this.reject(name, `probe failed: ${detail.slice(0, 160)}`);
            }
            return false;
        }
    }
    accept(name) {
        const existing = this.backends.find((entry) => entry.name === name);
        if (existing) {
            existing.available = true;
            delete existing.reason;
        }
        else {
            this.backends.push({ name, available: true });
        }
    }
    reject(name, reason) {
        const existing = this.backends.find((entry) => entry.name === name);
        if (existing) {
            existing.available = false;
            existing.reason = reason;
        }
        else {
            this.backends.push({ name, available: false, reason });
        }
    }
    async requestViaAddon(request) {
        const session = this.session;
        if (!session)
            throw new tiktok_errors_1.UpstreamUnreachableError('TLS session is not available');
        const options = {
            headers: request.headers ?? {},
            timeout: Math.max(1, Math.round((request.timeoutMs ?? 30_000) / 1000)),
        };
        if (request.body !== undefined)
            options.body = request.body;
        try {
            const response = request.method.toUpperCase() === 'POST'
                ? await session.post(request.url, options)
                : await session.get(request.url, options);
            return {
                status: response.status,
                headers: TlsImpersonateTransport_1.flatten(response.headers),
                body: Buffer.isBuffer(response.body)
                    ? response.body
                    : Buffer.from(response.body),
            };
        }
        catch (error) {
            throw new tiktok_errors_1.UpstreamUnreachableError(`TLS transport failed for ${request.url}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    requestViaBridge(request) {
        return this.bridgeCall(request);
    }
    bridgeCall(request) {
        const child = this.child;
        if (!child) {
            return Promise.reject(new tiktok_errors_1.UpstreamUnreachableError('curl_cffi bridge is not running'));
        }
        const id = this.nextId++;
        const payload = JSON.stringify({
            id,
            method: request.method,
            url: request.url,
            headers: request.headers ?? {},
            body: request.body === undefined ? null : Buffer.from(request.body).toString('base64'),
            timeout: Math.max(1, Math.round((request.timeoutMs ?? 30_000) / 1000)),
            redirects: true,
        });
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            try {
                child.stdin.write(payload + '\n');
            }
            catch (error) {
                this.pending.delete(id);
                reject(new tiktok_errors_1.UpstreamUnreachableError(`could not write to the curl_cffi bridge: ${error instanceof Error ? error.message : String(error)}`));
            }
        });
    }
    consumeBridge(chunk) {
        this.buffer += chunk;
        let index = this.buffer.indexOf('\n');
        while (index >= 0) {
            const line = this.buffer.slice(0, index).trim();
            this.buffer = this.buffer.slice(index + 1);
            if (line)
                this.settleBridge(line);
            index = this.buffer.indexOf('\n');
        }
    }
    settleBridge(line) {
        let parsed;
        try {
            parsed = JSON.parse(line);
        }
        catch {
            this.logger.warn(`bridge wrote a non-JSON line: ${line.slice(0, 160)}`);
            return;
        }
        if (typeof parsed.id !== 'number')
            return;
        const waiter = this.pending.get(parsed.id);
        if (!waiter)
            return;
        this.pending.delete(parsed.id);
        if (parsed.error) {
            waiter.reject(new tiktok_errors_1.UpstreamUnreachableError(`curl_cffi bridge: ${parsed.error}`));
            return;
        }
        waiter.resolve({
            status: parsed.status ?? 0,
            headers: parsed.headers ?? {},
            body: Buffer.from(parsed.body ?? '', 'base64'),
        });
    }
    failPending(reason) {
        for (const [, waiter] of this.pending) {
            waiter.reject(new tiktok_errors_1.UpstreamUnreachableError(reason));
        }
        this.pending.clear();
    }
    static resolveBridgeScript() {
        const candidates = [
            (0, node_path_1.join)(__dirname, '..', '..', '..', 'bridge', 'curl_cffi_bridge.py'),
            (0, node_path_1.join)(process.cwd(), 'bridge', 'curl_cffi_bridge.py'),
        ];
        for (const candidate of candidates) {
            if ((0, node_fs_1.existsSync)(candidate))
                return candidate;
        }
        throw new tiktok_errors_1.UpstreamUnreachableError(`curl_cffi bridge script not found; looked in ${candidates.join(', ')}`);
    }
    static flatten(headers) {
        const out = {};
        for (const [name, value] of Object.entries(headers ?? {})) {
            out[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
        }
        return out;
    }
};
exports.TlsImpersonateTransport = TlsImpersonateTransport;
exports.TlsImpersonateTransport = TlsImpersonateTransport = TlsImpersonateTransport_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(configuration_1.CONFIG)),
    __metadata("design:paramtypes", [Object])
], TlsImpersonateTransport);
//# sourceMappingURL=tls-impersonate.transport.js.map