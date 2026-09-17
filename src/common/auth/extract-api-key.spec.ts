import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { docsCookieHeader, extractDocsApiKey, extractHeaderApiKey } from './extract-api-key';
import { DocsAuthMiddleware } from '../middleware/docs-auth.middleware';

describe('extractApiKey', () => {
  it('reads x-api-key and Bearer tokens', () => {
    const headerReq = { header: (name: string) => ({ 'x-api-key': 'k1' }[name]) } as Request;
    const bearerReq = { header: (name: string) => ({ authorization: 'Bearer k2' }[name]) } as Request;
    expect(extractHeaderApiKey(headerReq)).toBe('k1');
    expect(extractHeaderApiKey(bearerReq)).toBe('k2');
  });

  it('reads docs key from query and cookie', () => {
    const queryReq = {
      header: () => undefined,
      query: { api_key: 'from-query' },
    } as unknown as Request;
    const cookieReq = {
      header: (name: string) => (name === 'cookie' ? 'tb24_docs_key=from-cookie' : undefined),
      query: {},
    } as unknown as Request;
    expect(extractDocsApiKey(queryReq)).toBe('from-query');
    expect(extractDocsApiKey(cookieReq)).toBe('from-cookie');
    expect(docsCookieHeader('k', false)).toContain('tb24_docs_key=k');
  });
});

describe('DocsAuthMiddleware', () => {
  const config = { get: jest.fn().mockReturnValue('secret-key') } as unknown as ConfigService;
  const middleware = new DocsAuthMiddleware(config);

  it('skips non-docs routes', () => {
    const next = jest.fn();
    middleware.use({ path: '/api/v1/leads', header: () => undefined } as unknown as Request, {} as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects docs without an API key', () => {
    const json = jest.fn();
    const res = { status: jest.fn(() => ({ json })), setHeader: jest.fn() } as unknown as Response;
    middleware.use(
      { path: '/docs', header: () => undefined, query: {} } as unknown as Request,
      res,
      jest.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('allows docs with a matching key and sets a cookie', () => {
    const next = jest.fn();
    const res = { status: jest.fn(), setHeader: jest.fn(), json: jest.fn() } as unknown as Response;
    middleware.use(
      {
        path: '/docs',
        header: (name: string) => ({ 'x-api-key': 'secret-key' }[name]),
        query: {},
        secure: false,
      } as unknown as Request,
      res,
      next,
    );
    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('tb24_docs_key='));
  });
});
