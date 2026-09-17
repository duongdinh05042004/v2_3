import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiSecurity('api-key')
@ApiHeader({ name: 'x-api-key', required: true })
@UseGuards(ApiKeyGuard)
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
