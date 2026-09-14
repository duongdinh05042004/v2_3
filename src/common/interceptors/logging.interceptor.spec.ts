import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  it('passes the request through', (done) => {
    const interceptor = new LoggingInterceptor();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', originalUrl: '/api/v1/leads' }),
      }),
    };
    interceptor.intercept(context as never, { handle: () => of({ ok: true }) }).subscribe((value) => {
      expect(value).toEqual({ ok: true });
      done();
    });
  });
});
