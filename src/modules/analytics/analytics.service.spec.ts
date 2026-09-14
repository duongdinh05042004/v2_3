import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const service = Object.create(AnalyticsService.prototype) as AnalyticsService;

  it('computes percentage rates safely', () => {
    expect(service.rate(25, 100)).toBe(25);
    expect(service.rate(1, 3)).toBe(33.33);
    expect(service.rate(5, 0)).toBe(0);
  });
});
