import { of, throwError } from 'rxjs';
import { LoggingInterceptor, redactUrl } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  it('passes the request through', (done) => {
    const interceptor = new LoggingInterceptor();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', originalUrl: '/api/v1/leads' }),
        getResponse: () => ({ statusCode: 200 }),
      }),
    };
    interceptor.intercept(context as never, { handle: () => of({ ok: true }) }).subscribe((value) => {
      expect(value).toEqual({ ok: true });
      done();
    });
  });

  it('still completes when the handler errors', (done) => {
    const interceptor = new LoggingInterceptor();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', originalUrl: '/api/v1/leads?api_key=secret' }),
        getResponse: () => ({ statusCode: 500 }),
      }),
    };
    interceptor.intercept(context as never, { handle: () => throwError(() => new Error('boom')) }).subscribe({
      error: () => done(),
    });
  });
});

describe('redactUrl', () => {
  it('redacts api keys in query strings', () => {
    expect(redactUrl('/docs?api_key=super-secret&x=1')).toBe('/docs?api_key=***&x=1');
  });
});
