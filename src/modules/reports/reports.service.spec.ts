import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const leads = {
    find: jest.fn(async () => [
      {
        id: '1',
        name: 'A',
        email: 'a@b.com',
        phoneE164: '+84901234567',
        city: 'HN',
        source: 'tiktok',
        campaignName: 'Sale',
        adName: 'Ad',
        status: 'new',
        qualityScore: 70,
        bitrix24Id: 1,
        createdAt: new Date(),
      },
    ]),
  };
  const deals = { find: jest.fn() };
  const analytics = { conversionRates: jest.fn(async () => ({})), campaignPerformance: jest.fn(async () => []) };
  const notifications = { emit: jest.fn() };
  const config = { get: jest.fn().mockReturnValue(24) };
  const service = new ReportsService(
    leads as never,
    deals as never,
    analytics as never,
    notifications as never,
    config as never,
  );

  it('exports JSON, CSV and XLSX buffers', async () => {
    const json = await service.export('json', 30);
    expect(json.mime).toBe('application/json');
    expect(json.filename).toContain('leads-30d.json');
    const csv = await service.export('csv', 7);
    expect(csv.mime).toBe('text/csv');
    const xlsx = await service.export('xlsx', 7);
    expect(xlsx.mime).toContain('spreadsheet');
  });

  it('emits daily report and stale lead alerts', async () => {
    leads.find.mockResolvedValueOnce([]);
    await service.dailyReport();
    expect(notifications.emit).toHaveBeenCalledWith('report.daily', expect.any(Object));
    const count = await service.alertStaleLeads();
    expect(count).toBe(0);
  });
});
