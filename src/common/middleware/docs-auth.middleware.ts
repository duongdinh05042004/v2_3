import { NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { docsCookieHeader, extractDocsApiKey } from '../auth/extract-api-key';
import { safeEqual } from '../utils/timing-safe.util';

export class DocsAuthMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const path = req.path ?? req.url ?? '';
    if (!path.startsWith('/docs')) {
      next();
      return;
    }

    const expected = this.config.get<string>('apiKey') ?? '';
    const provided = extractDocsApiKey(req);
    if (!expected || !provided || !safeEqual(provided, expected)) {
      res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'Invalid or missing API key',
        hint: 'Send header x-api-key or open /docs?api_key=YOUR_API_KEY',
      });
      return;
    }

    res.setHeader('Set-Cookie', docsCookieHeader(provided, req.secure));
    next();
  }
}
