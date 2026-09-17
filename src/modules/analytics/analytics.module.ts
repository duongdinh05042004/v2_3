import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { Campaign } from '../../database/entities/campaign.entity';
import { Deal } from '../../database/entities/deal.entity';
import { Lead } from '../../database/entities/lead.entity';
import { ConfigurationModule } from '../configuration/configuration.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Deal, Campaign]), ConfigurationModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ApiKeyGuard],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
