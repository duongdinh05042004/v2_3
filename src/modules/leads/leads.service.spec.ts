import { Lead } from '../../database/entities/lead.entity';
import { LeadsService } from './leads.service';
import { LeadNormalizerService, TikTokLeadPayload } from './lead-normalizer.service';
import { LeadMergeService } from './lead-merge.service';
import { LeadQualityService } from './lead-quality.service';
import sample from '../../../mocks/sample-payloads/lead.generate.json';

describe('LeadsService', () => {
  const saved: Lead[] = [];
  const leadRepo = {
    findOne: jest.fn(async ({ where }: { where: Partial<Lead> }) => {
      return (
        saved.find((lead) => {
          if (where.externalId) {
            return lead.externalId === where.externalId;
          }
          if (where.emailNormalized) {
            return lead.emailNormalized === where.emailNormalized && !lead.isDuplicate;
          }
          if (where.phoneE164) {
            return lead.phoneE164 === where.phoneE164 && !lead.isDuplicate;
          }
          return false;
        }) ?? null
      );
    }),
    create: jest.fn((data: Partial<Lead>) => ({ ...data, id: data.id ?? 'lead-1' })),
    save: jest.fn(async (lead: Lead) => {
      const index = saved.findIndex((item) => item.id === lead.id || item.externalId === lead.externalId);
      if (index >= 0) {
        saved[index] = lead;
      } else {
        saved.push(lead);
      }
      return lead;
    }),
  };
  const campaignRepo = {
    findOne: jest.fn(async () => null),
    create: jest.fn((data: unknown) => data),
    save: jest.fn(async (data: unknown) => data),
  };
  const config = { getQualityWeights: jest.fn(async () => undefined) };
  const timeline = { add: jest.fn(async () => undefined) };

  const service = new LeadsService(
    leadRepo as never,
    campaignRepo as never,
    new LeadNormalizerService(),
    new LeadMergeService(),
    new LeadQualityService(),
    config as never,
    timeline as never,
  );

  beforeEach(() => {
    saved.length = 0;
    jest.clearAllMocks();
  });

  it('creates a lead from the sample webhook and then deduplicates by email', async () => {
    const first = await service.ingest(sample as unknown as TikTokLeadPayload);
    expect(first.created).toBe(true);
    expect(first.lead.qualityScore).toBeGreaterThan(50);

    const second = await service.ingest({
      ...(sample as unknown as TikTokLeadPayload),
      event_id: 'evt_another',
      lead_data: {
        ...(sample as unknown as TikTokLeadPayload).lead_data,
        full_name: 'Nguyễn Văn A Updated',
      },
    });
    expect(second.merged).toBe(true);
    expect(second.lead.name).toBe('Nguyễn Văn A Updated');
    expect(timeline.add).toHaveBeenCalled();
  });

  it('is idempotent for the same event_id', async () => {
    await service.ingest(sample as unknown as TikTokLeadPayload);
    const again = await service.ingest(sample as unknown as TikTokLeadPayload);
    expect(again.created).toBe(false);
    expect(again.merged).toBe(false);
  });
});
