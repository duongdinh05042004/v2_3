import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '../common/constants';
import { ConversionEvent } from '../database/entities/conversion-event.entity';
import { DeadLetterJob } from '../database/entities/dead-letter-job.entity';
import { WebhookEvent } from '../database/entities/webhook-event.entity';
import { TikTokModule } from '../integrations/tiktok/tiktok.module';
import { DealsModule } from '../modules/deals/deals.module';
import { LeadsModule } from '../modules/leads/leads.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { ReportsModule } from '../modules/reports/reports.module';
import { SyncModule } from '../modules/sync/sync.module';
import { BitrixSyncProcessor } from './processors/bitrix-sync.processor';
import { ConversionProcessor } from './processors/conversion.processor';
import { LeadProcessor } from './processors/lead.processor';
import { ReportProcessor } from './processors/report.processor';
import { ReportSchedulerService } from './report-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEvent, DeadLetterJob, ConversionEvent]),
    LeadsModule,
    DealsModule,
    SyncModule,
    ReportsModule,
    NotificationsModule,
    TikTokModule,
    BullModule.registerQueue(
      { name: QUEUE_NAMES.LEAD_INGESTION },
      { name: QUEUE_NAMES.BITRIX_SYNC },
      { name: QUEUE_NAMES.TIKTOK_CONVERSION },
      { name: QUEUE_NAMES.REPORTS },
    ),
  ],
  providers: [
    LeadProcessor,
    BitrixSyncProcessor,
    ConversionProcessor,
    ReportProcessor,
    ReportSchedulerService,
  ],
})
export class QueueWorkersModule {}
