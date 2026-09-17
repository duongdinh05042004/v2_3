import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('ApiKeyGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const config = { get: jest.fn().mockReturnValue('secret-key') } as unknown as ConfigService;
  const guard = new ApiKeyGuard(reflector, config);

  const ctx = (headers: Record<string, string>): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          header: (name: string) => headers[name],
        }),
      }),
    }) as unknown as ExecutionContext;

  it('allows public routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    expect(guard.canActivate(ctx({}))).toBe(true);
  });

  it('accepts a matching x-api-key', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    expect(guard.canActivate(ctx({ 'x-api-key': 'secret-key' }))).toBe(true);
  });

  it('accepts a matching Bearer token', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    expect(guard.canActivate(ctx({ authorization: 'Bearer secret-key' }))).toBe(true);
  });

  it('rejects missing or wrong keys', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    expect(() => guard.canActivate(ctx({}))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(ctx({ 'x-api-key': 'nope' }))).toThrow(UnauthorizedException);
  });

  it('rejects when the server API key is not configured', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const unconfigured = new ApiKeyGuard(reflector, {
      get: jest.fn().mockReturnValue(''),
    } as unknown as ConfigService);
    expect(() => unconfigured.canActivate(ctx({ 'x-api-key': 'anything' }))).toThrow(UnauthorizedException);
  });
});
