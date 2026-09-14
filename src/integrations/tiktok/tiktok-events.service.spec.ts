import { ConfigService } from '@nestjs/config';
import { TikTokEventsService } from './tiktok-events.service';

describe('TikTokEventsService', () => {
  const service = new TikTokEventsService({
    get: (key: string) => {
      if (key === 'tiktok.apiBaseUrl') return 'http://tiktok.local';
      if (key === 'tiktok.accessToken') return 'token';
      if (key === 'tiktok.pixelCode') return 'C123';
      return undefined;
    },
  } as unknown as ConfigService);

  it('returns ok when Events API accepts the payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    const result = await service.sendConversion({
      event: 'CompletePayment',
      event_id: '1',
      timestamp: new Date().toISOString(),
      context: { ad: { callback: 'TT-1' } },
    });
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('degrades to mock=false ok when the remote API is down', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    const result = await service.sendConversion({
      event: 'CompletePayment',
      event_id: '1',
      timestamp: new Date().toISOString(),
      context: { ad: { callback: 'TT-1' } },
    });
    expect(result.ok).toBe(false);
    expect(result.mock).toBe(true);
  });
});
