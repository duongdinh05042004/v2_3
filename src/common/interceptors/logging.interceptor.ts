import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const started = Date.now();
    const path = redactUrl(req.originalUrl ?? req.url ?? '');

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(`${req.method} ${path} ${res.statusCode} ${Date.now() - started}ms`);
        },
        error: () => {
          this.logger.warn(`${req.method} ${path} failed ${Date.now() - started}ms`);
        },
      }),
    );
  }
}

export function redactUrl(url: string): string {
  return url
    .replace(/([?&](?:api[_-]?key|token|secret|authorization)=)[^&]*/gi, '$1***')
    .replace(/(x-api-key=)[^&]*/gi, '$1***');
}
