import { ConfigService } from '@nestjs/config';
import { TikTokSignatureService } from './tiktok-signature.service';

describe('TikTokSignatureService', () => {
  const secret = 'tiktok_app_secret_change_me';
  const service = new TikTokSignatureService({
    get: (key: string) => {
      if (key === 'tiktok.appSecret') {
        return secret;
      }
      if (key === 'tiktok.webhookToleranceSeconds') {
        return 300;
      }
      return undefined;
    },
  } as unknown as ConfigService);

  const body = JSON.stringify({ event: 'lead.generate', event_id: 'evt_1' });

  it('generates and verifies a valid signature', () => {
    const now = 1_700_000_000;
    const header = service.generate(body, secret, now);
    const result = service.verify(body, header, { secret, now, toleranceSeconds: 300 });
    expect(result.valid).toBe(true);
    expect(result.timestamp).toBe(now);
  });

  it('rejects missing or malformed headers', () => {
    expect(service.verify(body, undefined).valid).toBe(false);
    expect(service.verify(body, 'not-valid').valid).toBe(false);
  });

  it('rejects expired timestamps and wrong signatures', () => {
    const header = service.generate(body, secret, 100);
    expect(service.verify(body, header, { now: 10000, toleranceSeconds: 10 }).valid).toBe(false);
    expect(service.verify(body, 't=100,s=deadbeef', { now: 100, secret }).valid).toBe(false);
  });

  it('parses header parts', () => {
    expect(service.parseHeader('t=10,s=abc')).toEqual({ timestamp: 10, signature: 'abc' });
    expect(service.parseHeader('broken')).toBeNull();
  });
});
