import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { TiktokResponse } from './tiktok.client';
export declare class UpstreamHeadersInterceptor implements NestInterceptor<TiktokResponse, unknown> {
    intercept(context: ExecutionContext, next: CallHandler<TiktokResponse>): Observable<unknown>;
}
