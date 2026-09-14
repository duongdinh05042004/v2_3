import { createHmac } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { safeEqual } from '../../common/utils/timing-safe.util';

export type SignatureResult = {
  valid: boolean;
  reason?: string;
  timestamp?: number;
};

/**
 * TikTok-Signature format (Stripe-like, recommended for production):
 *   TikTok-Signature: t=<unix_seconds>,s=<hex_hmac_sha256>
 *
 * Signed payload = `${timestamp}.${rawBody}`
 * HMAC key = TIKTOK_APP_SECRET
 *
 * Replay protection rejects timestamps older than the configured tolerance.
 */
@Injectable()
export class TikTokSignatureService {
  constructor(private readonly config: ConfigService) {}

  generate(rawBody: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): string {
    const digest = this.sign(`${timestamp}.${rawBody}`, secret);
    return `t=${timestamp},s=${digest}`;
  }

  verify(
    rawBody: string,
    header: string | undefined,
    options?: { secret?: string; now?: number; toleranceSeconds?: number },
  ): SignatureResult {
    if (!header) {
      return { valid: false, reason: 'Missing TikTok-Signature header' };
    }

    const parsed = this.parseHeader(header);
    if (!parsed) {
      return { valid: false, reason: 'Malformed TikTok-Signature header' };
    }

    const secret = options?.secret ?? this.config.get<string>('tiktok.appSecret') ?? '';
    const now = options?.now ?? Math.floor(Date.now() / 1000);
    const tolerance =
      options?.toleranceSeconds ??
      this.config.get<number>('tiktok.webhookToleranceSeconds') ??
      300;

    if (Math.abs(now - parsed.timestamp) > tolerance) {
      return { valid: false, reason: 'Webhook timestamp outside tolerance window', timestamp: parsed.timestamp };
    }

    const expected = this.sign(`${parsed.timestamp}.${rawBody}`, secret);
    if (!safeEqual(expected, parsed.signature)) {
      return { valid: false, reason: 'Signature mismatch', timestamp: parsed.timestamp };
    }

    return { valid: true, timestamp: parsed.timestamp };
  }

  parseHeader(header: string): { timestamp: number; signature: string } | null {
    const parts = header.split(',').map((part) => part.trim());
    const map = new Map<string, string>();
    for (const part of parts) {
      const eq = part.indexOf('=');
      if (eq === -1) {
        continue;
      }
      map.set(part.slice(0, eq), part.slice(eq + 1));
    }
    const timestamp = Number(map.get('t'));
    const signature = map.get('s');
    if (!Number.isFinite(timestamp) || !signature) {
      return null;
    }
    return { timestamp, signature };
  }

  private sign(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
  }
}
