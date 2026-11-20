import { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
export declare class RequestIdMiddleware implements NestMiddleware {
    use(req: Request & {
        id?: string;
    }, res: Response, next: NextFunction): void;
}
