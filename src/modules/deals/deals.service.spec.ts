import { ConflictException } from '@nestjs/common';
import { DEAL_STATUS } from '../../common/constants';
import { Lead } from '../../database/entities/lead.entity';
import { DealsService } from './deals.service';
import { RuleEngineService } from '../rules/rule-engine.service';
import { defaultDealRules } from '../../database/seeds/seed-data';

describe('DealsService', () => {
  const lead: Lead = {
    id: 'lead-1',
    name: 'Nguyễn Văn A',
    campaignName: 'Spring Sale 2024',
    campaignId: '123',
    city: 'Hà Nội',
    interests: ['technology'],
    customQuestions: [{ question: 'Budget range', answer: '5-10 triệu VND' }],
    qualityScore: 80,
    email: 'a@b.com',
    phoneE164: '+84901234567',
    ttclid: 'TT-1',
    source: 'tiktok',
  } as Lead;

  const dealRepo = {
    findOne: jest.fn(),
    create: jest.fn((data: unknown) => data),
    save: jest.fn(async (data: { id?: string }) => ({ id: 'deal-1', ...data })),
    update: jest.fn(),
    findAndCount: jest.fn(),
  };
  const conversionRepo = {
    save: jest.fn(async (data: Record<string, unknown>) => ({ id: 'conv-1', ...data })),
    create: jest.fn((d: Record<string, unknown>) => d),
  };
  const bitrixQueue = { add: jest.fn() };
  const conversionQueue = { add: jest.fn() };
  const leads = { findOne: jest.fn(async () => lead), markConverted: jest.fn() };
  const assignment = { assign: jest.fn(async () => ({ assignedTo: 'sp_tech', assignedByRule: 'assign-tech' })) };
  const config = {
    getRules: jest.fn(async () => defaultDealRules),
    getPipeline: jest.fn(async () => ({
      stages: [{ id: 'NEW', probability: 10 }],
    })),
    getAssignment: jest.fn(async () => ({ rules: [], fallback: 'sp_round_robin' })),
  };
  const timeline = { add: jest.fn() };
  const notifications = { emit: jest.fn() };

  const service = new DealsService(
    dealRepo as never,
    conversionRepo as never,
    bitrixQueue as never,
    conversionQueue as never,
    leads as never,
    new RuleEngineService(),
    assignment as never,
    config as never,
    timeline as never,
    notifications as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    dealRepo.findOne.mockResolvedValue(null);
  });

  it('builds a rule-engine context from a lead', () => {
    const context = service.buildContext(lead);
    expect(context.campaign).toEqual(expect.objectContaining({ campaign_name: 'Spring Sale 2024' }));
    expect(context.quality_score).toBe(80);
  });

  it('converts a matching lead into a deal and assigns a salesperson', async () => {
    const deal = await service.convertLead('lead-1');
    expect(deal.title).toContain('Nguyễn Văn A');
    expect(deal.assignedTo).toBe('sp_tech');
    expect(deal.amount).toBe(String(5_000_000));
    expect(leads.markConverted).toHaveBeenCalledWith('lead-1');
    expect(bitrixQueue.add).toHaveBeenCalled();
    expect(notifications.emit).toHaveBeenCalledWith('deal.created', expect.any(Object));
  });

  it('rejects a second open deal unless forced', async () => {
    dealRepo.findOne.mockResolvedValue({ id: 'existing' });
    await expect(service.convertLead('lead-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('applies matching rules when no deal exists yet', async () => {
    const created = await service.applyRulesIfMatch(lead);
    expect(created?.assignedTo).toBe('sp_tech');
  });

  it('lists, fetches and marks deals as synced', async () => {
    dealRepo.findAndCount.mockResolvedValue([[{ id: 'deal-1' }], 1]);
    dealRepo.findOne.mockResolvedValue({ id: 'deal-1', lead });
    const listed = await service.findAll({ page: 1, limit: 10, status: 'open', assignedTo: 'sp_tech' });
    expect(listed.meta.total).toBe(1);
    await expect(service.findOne('deal-1')).resolves.toMatchObject({ id: 'deal-1' });
    await service.markSynced('deal-1', 88);
    expect(dealRepo.update).toHaveBeenCalledWith('deal-1', expect.objectContaining({ bitrix24Id: 88 }));
    await expect(service.findByBitrixId(88)).resolves.toMatchObject({ id: 'deal-1' });
  });

  it('emits TikTok conversion when a deal is won', async () => {
    dealRepo.findOne.mockResolvedValue({
      id: 'deal-1',
      leadId: 'lead-1',
      lead,
      amount: '1000',
      currency: 'VND',
    });
    dealRepo.save.mockImplementation(async (data: { id?: string }) => ({ id: 'deal-1', ...data }));
    await service.updateStatus('deal-1', DEAL_STATUS.WON, 'WON');
    expect(conversionQueue.add).toHaveBeenCalled();
    expect(notifications.emit).toHaveBeenCalledWith('deal.won', expect.any(Object));
  });
});
