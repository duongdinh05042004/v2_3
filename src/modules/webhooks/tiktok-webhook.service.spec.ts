import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TikTokSignatureService } from '../../integrations/tiktok/tiktok-signature.service';
import { TikTokLeadPayload } from '../leads/lead-normalizer.service';
import { TikTokWebhookService } from './tiktok-webhook.service';

describe('TikTokWebhookService', () => {
  const signatures = new TikTokSignatureService({
    get: (key: string) => (key === 'tiktok.appSecret' ? 'secret' : 300),
  } as unknown as ConfigService);
  const stored: Array<{ eventId: string }> = [];
  const events = {
    findOne: jest.fn(async ({ where }: { where: { eventId: string } }) =>
      stored.find((item) => item.eventId === where.eventId),
    ),
    create: jest.fn((data: { eventId: string }) => data),
    save: jest.fn(async (data: { eventId: string }) => {
      stored.push(data);
      return data;
    }),
  };
  const leadQueue = { add: jest.fn(async () => undefined) };
  const service = new TikTokWebhookService(events as never, signatures, leadQueue as never);

  const payload = { event: 'lead.generate', event_id: 'evt_abc', timestamp: 1 } as TikTokLeadPayload;

  beforeEach(() => {
    stored.length = 0;
    jest.clearAllMocks();
  });

  it('rejects invalid signatures after persisting the raw event', async () => {
    await expect(service.handle('{}', 't=1,s=bad', payload, {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(events.save).toHaveBeenCalled();
  });

  it('enqueues a new valid webhook and ignores duplicates', async () => {
    const raw = JSON.stringify(payload);
    const header = signatures.generate(raw, 'secret', Math.floor(Date.now() / 1000));
    const first = await service.handle(raw, header, payload, {});
    expect(first.duplicate).toBe(false);
    expect(leadQueue.add).toHaveBeenCalled();
    const second = await service.handle(raw, header, payload, {});
    expect(second.duplicate).toBe(true);
  });
});
