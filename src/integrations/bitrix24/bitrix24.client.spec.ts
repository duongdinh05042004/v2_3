import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { Bitrix24Client } from './bitrix24.client';

describe('Bitrix24Client', () => {
  const client = new Bitrix24Client({
    get: (key: string) => (key === 'bitrix24.webhookUrl' ? 'http://b24.local/rest' : 2000),
  } as unknown as ConfigService);

  it('creates a lead and returns the Bitrix id', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 42 }),
    }) as unknown as typeof fetch;
    await expect(client.crmLeadAdd({ NAME: 'A' })).resolves.toBe(42);
  });

  it('throws when Bitrix returns an error payload', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'QUERY_ERROR', error_description: 'bad' }),
    }) as unknown as typeof fetch;
    await expect(client.crmDealAdd({ TITLE: 'X' })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('covers remaining CRM helpers', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: true }),
    }) as unknown as typeof fetch;
    await expect(client.crmLeadUpdate(1, { NAME: 'B' })).resolves.toBe(true);
    await expect(client.crmDealUpdate(2, { TITLE: 'Y' })).resolves.toBe(true);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { ID: 1 } }),
    }) as unknown as typeof fetch;
    await expect(client.crmLeadGet(1)).resolves.toEqual({ ID: 1 });
    await expect(
      client.crmTimelineCommentAdd({ ENTITY_ID: 1, ENTITY_TYPE: 'lead', COMMENT: 'hi' }),
    ).resolves.toEqual({ ID: 1 });
  });
});

