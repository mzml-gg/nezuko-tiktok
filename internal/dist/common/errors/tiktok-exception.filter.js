"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TiktokExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const tiktok_errors_1 = require("./tiktok-errors");
let TiktokExceptionFilter = class TiktokExceptionFilter {
    logger = new common_1.Logger('TiktokError');
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const requestId = request.id ?? request.headers['x-request-id'];
        const envelope = this.toEnvelope(exception, request, requestId);
        const status = envelope.error.statusCode;
        if (status >= 500) {
            this.logger.error(`[${requestId ?? '-'}] ${request.method} ${request.originalUrl} -> ${status} ${envelope.error.kind}: ${envelope.error.message}`, exception instanceof Error ? exception.stack : undefined);
        }
        else if ((0, tiktok_errors_1.isTiktokError)(exception)) {
            this.logger.warn(`[${requestId ?? '-'}] ${request.method} ${request.originalUrl} -> ${status} ${envelope.error.kind}: ${envelope.error.message}` +
                (exception.details.logId ? ` (logId=${exception.details.logId})` : ''));
        }
        else {
            this.logger.warn(`[${requestId ?? '-'}] ${request.method} ${request.originalUrl} -> ${status}: ${envelope.error.message}`);
        }
        if (response.headersSent)
            return;
        response.status(status).json(envelope);
    }
    toEnvelope(exception, request, requestId) {
        const id = Array.isArray(requestId) ? requestId[0] : requestId;
        if ((0, tiktok_errors_1.isTiktokError)(exception)) {
            const payload = exception.toPayload();
            return {
                error: {
                    kind: payload.kind,
                    message: payload.message,
                    statusCode: payload.statusCode,
                    requestId: id,
                    path: request.originalUrl,
                    details: payload.details,
                    hint: payload.hint,
                },
            };
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const body = exception.getResponse();
            const message = typeof body === 'string'
                ? body
                : (body.message ?? exception.message);
            return {
                error: {
                    kind: status === common_1.HttpStatus.NOT_FOUND ? 'NOT_FOUND' : 'BAD_REQUEST',
                    message: Array.isArray(message) ? message.join('; ') : message,
                    statusCode: status,
                    requestId: id,
                    path: request.originalUrl,
                    details: typeof body === 'object' && body !== null ? { validation: body } : {},
                },
            };
        }
        return {
            error: {
                kind: 'INTERNAL',
                message: 'An unexpected internal error occurred.',
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                requestId: id,
                path: request.originalUrl,
            },
        };
    }
};
exports.TiktokExceptionFilter = TiktokExceptionFilter;
exports.TiktokExceptionFilter = TiktokExceptionFilter = __decorate([
    (0, common_1.Catch)()
], TiktokExceptionFilter);
//# sourceMappingURL=tiktok-exception.filter.js.map