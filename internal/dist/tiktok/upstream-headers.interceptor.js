"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpstreamHeadersInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let UpstreamHeadersInterceptor = class UpstreamHeadersInterceptor {
    intercept(context, next) {
        const res = context.switchToHttp().getResponse();
        return next.handle().pipe((0, rxjs_1.map)((upstream) => {
            res.setHeader('X-Tiktok-Logid', upstream.logId ?? '');
            res.setHeader('X-Tiktok-Upstream-Status', String(upstream.status));
            res.setHeader('X-Tiktok-Signed', String(upstream.signature.applied));
            res.setHeader('X-Tiktok-Sign-Ms', String(upstream.signature.ms));
            res.setHeader('X-Tiktok-Elapsed-Ms', String(upstream.elapsedMs));
            res.setHeader('X-Tiktok-Attempts', String(upstream.attempts));
            if (upstream.ticketGuardResult !== undefined) {
                res.setHeader('X-Tiktok-Ticket-Guard', String(upstream.ticketGuardResult));
            }
            return upstream.data;
        }));
    }
};
exports.UpstreamHeadersInterceptor = UpstreamHeadersInterceptor;
exports.UpstreamHeadersInterceptor = UpstreamHeadersInterceptor = __decorate([
    (0, common_1.Injectable)()
], UpstreamHeadersInterceptor);
//# sourceMappingURL=upstream-headers.interceptor.js.map