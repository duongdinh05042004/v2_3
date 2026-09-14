import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  const interceptor = new TransformInterceptor();

  it('wraps API responses', (done) => {
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ url: '/api/v1/leads' }) }),
    };
    interceptor.intercept(context as never, { handle: () => of({ ok: true }) }).subscribe((value) => {
      expect(value).toEqual({ success: true, data: { ok: true } });
      done();
    });
  });

  it('does not wrap webhooks', (done) => {
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ url: '/webhooks/tiktok/leads' }) }),
    };
    interceptor.intercept(context as never, { handle: () => of({ accepted: true }) }).subscribe((value) => {
      expect(value).toEqual({ accepted: true });
      done();
    });
  });
});
