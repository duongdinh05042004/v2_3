import { Request } from 'express';

const DOCS_COOKIE = 'tb24_docs_key';

export function extractHeaderApiKey(req: Request): string | undefined {
  const header = req.header('x-api-key') ?? req.header('authorization')?.replace(/^Bearer\s+/i, '');
  const value = header?.trim();
  return value || undefined;
}

export function extractDocsApiKey(req: Request): string | undefined {
  const fromHeader = extractHeaderApiKey(req);
  if (fromHeader) {
    return fromHeader;
  }
  const query = req.query?.api_key;
  if (typeof query === 'string' && query.trim()) {
    return query.trim();
  }
  return readCookie(req.header('cookie'), DOCS_COOKIE);
}

export function docsCookieHeader(apiKey: string, secure: boolean): string {
  const flags = ['HttpOnly', 'SameSite=Strict', 'Path=/docs'];
  if (secure) {
    flags.push('Secure');
  }
  return `${DOCS_COOKIE}=${encodeURIComponent(apiKey)}; ${flags.join('; ')}`;
}

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) {
    return undefined;
  }
  for (const part of header.split(';')) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === name) {
      const value = decodeURIComponent(rest.join('='));
      return value || undefined;
    }
  }
  return undefined;
}
