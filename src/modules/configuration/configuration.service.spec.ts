import { CONFIG_KEYS } from '../../common/constants';
import { ConfigurationService } from './configuration.service';

describe('ConfigurationService', () => {
  const store = new Map<string, { key: string; value: unknown; description?: string }>();
  const repo = {
    findOne: jest.fn(async ({ where }: { where: { key: string } }) => store.get(where.key) ?? null),
    save: jest.fn(async (row: { key: string; value: unknown; description?: string }) => {
      store.set(row.key, row);
      return row;
    }),
    create: jest.fn((row: { key: string; value: unknown }) => row),
  };
  const cache = {
    wrap: jest.fn(async (_key: string, factory: () => Promise<unknown>) => factory()),
    del: jest.fn(),
  };
  const service = new ConfigurationService(repo as never, cache as never);

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  it('stores and returns mappings and rules', async () => {
    const mapping = await service.saveMappings({ 'lead_data.email': 'EMAIL[0][VALUE]' });
    expect(mapping['lead_data.email']).toBe('EMAIL[0][VALUE]');
    expect(store.get(CONFIG_KEYS.FIELD_MAPPING)?.value).toEqual(mapping);
    await service.saveRules([{ condition: 'a EQUALS b', action: 'create_deal' }]);
    expect(cache.del).toHaveBeenCalled();
  });

  it('returns fallbacks when keys are missing', async () => {
    expect(await service.getMappings()).toEqual({});
    expect(await service.getRules()).toEqual([]);
    const assignment = await service.getAssignment();
    expect(assignment.fallback).toBe('sp_round_robin');
    expect((await service.getPipeline()).stages).toEqual([]);
    expect((await service.getQualityWeights()).hasEmail).toBe(15);
    expect(await service.getCampaignCosts()).toEqual({});
  });
});

