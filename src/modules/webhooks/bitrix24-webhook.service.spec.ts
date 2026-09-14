import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bitrix24WebhookService } from './bitrix24-webhook.service';

describe('Bitrix24WebhookService', () => {
  const events = { create: jest.fn((d: unknown) => d), save: jest.fn(async (d: unknown) => d) };
  const deals = { findByBitrixId: jest.fn(), updateStatus: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('expected-secret') } as unknown as ConfigService;
  const service = new Bitrix24WebhookService(events as never, deals as never, config);

  it('rejects an invalid secret', async () => {
    await expect(service.handle({ event: 'ONCRMDEALUPDATE' }, 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('updates a mapped deal when Bitrix24 stage changes', async () => {
    deals.findByBitrixId.mockResolvedValue({ id: 'deal-1' });
    await service.handle(
      { event: 'ONCRMDEALUPDATE', data: { FIELDS: { ID: 99, STAGE_ID: 'WON' } } },
      'expected-secret',
    );
    expect(deals.updateStatus).toHaveBeenCalledWith('deal-1', 'won', 'WON');
  });
});
