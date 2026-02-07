import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../types/api.types';

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function errorMiddleware(
    error: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';

    res.status(statusCode).json(
        errorResponse(error.message || 'Internal server error', code, {
            path: req.path,
            method: req.method,
        })
    );
}

export function notFoundMiddleware(
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    res.status(404).json(
        errorResponse('Route not found', 'NOT_FOUND', {
            path: req.path,
            method: req.method,
        })
    );
}
