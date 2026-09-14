import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type TikTokConversionPayload = {
  event: string;
  event_id: string;
  timestamp: string;
  context: {
    ad: { callback: string };
  };
  properties?: Record<string, unknown>;
};

@Injectable()
export class TikTokEventsService {
  private readonly logger = new Logger(TikTokEventsService.name);

  constructor(private readonly config: ConfigService) {}

  async sendConversion(payload: TikTokConversionPayload): Promise<{ ok: boolean; mock?: boolean }> {
    const baseUrl = this.config.get<string>('tiktok.apiBaseUrl') ?? '';
    const token = this.config.get<string>('tiktok.accessToken') ?? '';
    const pixel = this.config.get<string>('tiktok.pixelCode') ?? '';
    const url = `${baseUrl.replace(/\/$/, '')}/open_api/v1.3/event/track/`;

    const body = {
      event_source: 'web',
      event_source_id: pixel,
      data: [payload],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': token,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`TikTok Events API HTTP ${response.status}`);
      }
      return { ok: true };
    } catch (error) {
      this.logger.warn(
        `TikTok conversion sync failed, recorded locally: ${error instanceof Error ? error.message : error}`,
      );
      return { ok: false, mock: true };
    }
  }
}
