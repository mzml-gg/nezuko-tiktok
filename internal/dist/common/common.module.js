"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const configuration_1 = require("../config/configuration");
const tls_impersonate_transport_1 = require("./http/tls-impersonate.transport");
const http_client_1 = require("./http/http-client");
const rate_limiter_1 = require("./http/rate-limiter");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            { provide: configuration_1.CONFIG, useFactory: () => (0, configuration_1.loadConfig)() },
            http_client_1.HttpClient,
            tls_impersonate_transport_1.TlsImpersonateTransport,
            {
                provide: rate_limiter_1.RateLimiter,
                useFactory: (config) => new rate_limiter_1.RateLimiter({
                    minIntervalMs: config.tiktok.minRequestIntervalMs,
                    maxConcurrent: config.tiktok.maxConcurrentRequests,
                }),
                inject: [configuration_1.CONFIG],
            },
        ],
        exports: [configuration_1.CONFIG, http_client_1.HttpClient, rate_limiter_1.RateLimiter],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map