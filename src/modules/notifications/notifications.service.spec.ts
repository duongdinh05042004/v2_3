import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const saved: Array<{ status: string; channel: string }> = [];
  const repo = {
    create: jest.fn((data: unknown) => data),
    save: jest.fn(async (row: { status: string; channel: string }) => {
      saved.push(row);
      return row;
    }),
  };

  it('writes a log notification when no webhook URL is configured', async () => {
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const service = new NotificationsService(repo as never, config);
    await service.emit('lead.created', { id: 1 });
    expect(saved.at(-1)?.status).toBe('sent');
    expect(saved.at(-1)?.channel).toBe('log');
  });

  it('posts to an outbound webhook', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
    const config = {
      get: jest.fn((key: string) => (key === 'notify.webhookUrl' ? 'http://hooks.local' : 'from@x')),
    } as unknown as ConfigService;
    const service = new NotificationsService(repo as never, config);
    await service.emit('deal.won', { id: 2 });
    expect(global.fetch).toHaveBeenCalled();
  });
});
