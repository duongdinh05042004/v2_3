import { AnalyticsService } from './analytics.service';

describe('AnalyticsService.computeConversionRates', () => {
  const leads: { count: jest.Mock; createQueryBuilder?: jest.Mock } = { count: jest.fn() };
  const deals = { count: jest.fn() };
  const campaigns = { find: jest.fn().mockResolvedValue([]) };
  const cache = { wrap: jest.fn(async (_k: string, fn: () => Promise<unknown>) => fn()) };
  const config = { getCampaignCosts: jest.fn().mockResolvedValue({}) };
  const service = new AnalyticsService(
    leads as never,
    deals as never,
    campaigns as never,
    cache as never,
    config as never,
  );

  it('aggregates conversion rates', async () => {
    leads.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3);
    deals.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1).mockResolvedValueOnce(1);
    const rates = await service.computeConversionRates();
    expect(rates.totalLeads).toBe(10);
    expect(rates.leadToDealRate).toBe(30);
    expect(rates.dealWonRate).toBe(25);
  });

  it('computes campaign CPL and ROI', async () => {
    leads.createQueryBuilder = jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          campaignId: 'c1',
          campaignName: 'Sale',
          leads: '2',
          deals: '1',
          wonDeals: '1',
          revenue: '200',
          avgQualityScore: '80',
        },
      ]),
    }));
    campaigns.find.mockResolvedValue([{ campaignId: 'c1', spend: '100' }]);
    const rows = await service.computeCampaignPerformance();
    expect(rows[0].costPerLead).toBe(50);
    expect(rows[0].roi).toBe(1);
  });

  it('exposes cached dashboard helpers', async () => {
    jest.spyOn(service, 'computeConversionRates').mockResolvedValue({
      totalLeads: 1,
      qualifiedLeads: 1,
      convertedLeads: 1,
      openDeals: 0,
      wonDeals: 1,
      lostDeals: 0,
      leadToDealRate: 100,
      dealWonRate: 100,
      overallWonRate: 100,
    });
    jest.spyOn(service, 'computeCampaignPerformance').mockResolvedValue([]);
    await expect(service.conversionRates()).resolves.toMatchObject({ totalLeads: 1 });
    await expect(service.campaignPerformance()).resolves.toEqual([]);
    const dash = await service.dashboard();
    expect(dash.generatedAt).toBeDefined();
  });
});

