import { NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadNormalizerService, TikTokLeadPayload } from './lead-normalizer.service';
import { LeadMergeService } from './lead-merge.service';
import { LeadQualityService } from './lead-quality.service';

describe('LeadsService queries', () => {
  const lead = { id: 'lead-1', name: 'A', isDuplicate: false };
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[lead], 1]),
  };
  const leadRepo: {
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
    update: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
  } = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => qb),
    update: jest.fn(),
    find: jest.fn().mockResolvedValue([lead]),
    save: jest.fn(async (row: unknown) => row),
  };
  const service = new LeadsService(
    leadRepo as never,
    { findOne: jest.fn(), create: jest.fn(), save: jest.fn() } as never,
    new LeadNormalizerService(),
    new LeadMergeService(),
    new LeadQualityService(),
    { getQualityWeights: jest.fn() } as never,
    { add: jest.fn() } as never,
  );

  it('paginates leads and supports search', async () => {
    const result = await service.findAll({ page: 1, limit: 10, source: 'tiktok', search: 'A' });
    expect(result.meta.total).toBe(1);
    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('throws when a lead is missing', async () => {
    leadRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('batch-imports payloads and records failures', async () => {
    jest.spyOn(service, 'ingest').mockResolvedValueOnce({
      lead: lead as never,
      created: true,
      merged: false,
    });
    jest.spyOn(service, 'ingest').mockRejectedValueOnce(new Error('bad'));
    const result = await service.batchImport([
      { event_id: '1' } as TikTokLeadPayload,
      { event_id: '2' } as TikTokLeadPayload,
    ]);
    expect(result.created).toBe(1);
    expect(result.failed).toHaveLength(1);
  });

  it('updates sync and conversion flags', async () => {
    leadRepo.findOne.mockResolvedValue({ id: 'lead-1' });
    await service.markSynced('lead-1', 9);
    await service.markSyncFailed('lead-1', 'timeout');
    await service.markConverted('lead-1');
    expect(leadRepo.update).toHaveBeenCalled();
    await expect(service.searchByName('A')).resolves.toHaveLength(1);
  });
});

