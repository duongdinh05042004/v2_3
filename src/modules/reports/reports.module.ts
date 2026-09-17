import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { Deal } from '../../database/entities/deal.entity';
import { Lead } from '../../database/entities/lead.entity';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Deal]), AnalyticsModule, NotificationsModule],
  controllers: [ReportsController],
  providers: [ReportsService, ApiKeyGuard],
  exports: [ReportsService],
})
export class ReportsModule {}
