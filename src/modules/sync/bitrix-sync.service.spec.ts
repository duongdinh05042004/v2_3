import { BitrixSyncService } from './bitrix-sync.service';
import { defaultFieldMapping } from '../../database/seeds/seed-data';
import { FieldMapperService } from '../mapping/field-mapper.service';
import sample from '../../../mocks/sample-payloads/lead.generate.json';

describe('BitrixSyncService', () => {
  const bitrix = {
    crmLeadAdd: jest.fn(async () => 555),
    crmLeadUpdate: jest.fn(async () => true),
    crmTimelineCommentAdd: jest.fn(async () => 1),
    crmDealAdd: jest.fn(async () => 777),
    crmDealUpdate: jest.fn(async () => true),
  };
  const config = { getMappings: jest.fn(async () => defaultFieldMapping) };
  const leads = {
    findOne: jest.fn(),
    markSynced: jest.fn(),
    markSyncFailed: jest.fn(),
  };
  const deals = { findOne: jest.fn(), markSynced: jest.fn() };
  const timeline = { add: jest.fn() };
  const leadRepo = { update: jest.fn() };
  const service = new BitrixSyncService(
    bitrix as never,
    new FieldMapperService(),
    config as never,
    leads as never,
    deals as never,
    timeline as never,
    leadRepo as never,
  );

  it('creates a Bitrix24 lead from mapped TikTok fields', async () => {
    leads.findOne.mockResolvedValue({
      id: 'lead-1',
      bitrix24Id: null,
      qualityScore: 80,
      externalId: 'evt_1',
      campaignName: 'Spring Sale 2024',
      rawData: sample,
      interests: ['technology'],
      customQuestions: [{ question: 'Budget', answer: '5' }],
    });
    const id = await service.syncLead('lead-1');
    expect(id).toBe(555);
    expect(bitrix.crmLeadAdd).toHaveBeenCalledWith(expect.objectContaining({ NAME: 'Nguyễn Văn A' }));
    expect(leads.markSynced).toHaveBeenCalledWith('lead-1', 555);
  });

  it('records sync failure', async () => {
    leads.findOne.mockResolvedValue({
      id: 'lead-1',
      bitrix24Id: 9,
      rawData: sample,
      interests: [],
      customQuestions: [],
    });
    bitrix.crmLeadUpdate.mockRejectedValueOnce(new Error('timeout'));
    await expect(service.syncLead('lead-1')).rejects.toThrow('timeout');
    expect(leads.markSyncFailed).toHaveBeenCalled();
  });

  it('creates a Bitrix24 deal linked to the lead', async () => {
    deals.findOne.mockResolvedValue({
      id: 'deal-1',
      title: 'Sale - A',
      amount: '1000',
      currency: 'VND',
      stage: 'NEW',
      probability: 30,
      leadId: 'lead-1',
      bitrix24Id: null,
      lead: { bitrix24Id: 555 },
    });
    const id = await service.syncDeal('deal-1');
    expect(id).toBe(777);
    expect(bitrix.crmDealAdd).toHaveBeenCalled();
    expect(deals.markSynced).toHaveBeenCalledWith('deal-1', 777);
  });
});

