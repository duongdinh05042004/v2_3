import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export type Envelope<T> = {
  success: true;
  data: T;
};

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Envelope<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Envelope<T> | T> {
    const req = context.switchToHttp().getRequest<{ url?: string }>();
    if (
      req.url?.startsWith('/health') ||
      req.url?.startsWith('/webhooks') ||
      req.url?.startsWith('/docs') ||
      req.url?.includes('/reports/export')
    ) {
      return next.handle();
    }
    return next.handle().pipe(map((data) => ({ success: true as const, data })));
  }
}
