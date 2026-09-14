import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('conversion-rates')
  @ApiOperation({ summary: 'TikTok lead to Deal won conversion rates' })
  conversionRates() {
    return this.analytics.conversionRates();
  }

  @Get('campaign-performance')
  @ApiOperation({ summary: 'Cost per lead, ROI and quality score by campaign' })
  campaignPerformance() {
    return this.analytics.campaignPerformance();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Real-time dashboard snapshot' })
  dashboard() {
    return this.analytics.dashboard();
  }
}
