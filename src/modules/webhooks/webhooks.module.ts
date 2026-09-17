import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../common/constants';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { WebhookEvent } from '../../database/entities/webhook-event.entity';
import { TikTokModule } from '../../integrations/tiktok/tiktok.module';
import { DealsModule } from '../deals/deals.module';
import { Bitrix24WebhookService } from './bitrix24-webhook.service';
import { TikTokWebhookService } from './tiktok-webhook.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEvent]),
    TikTokModule,
    DealsModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.LEAD_INGESTION }),
  ],
  controllers: [WebhooksController],
  providers: [TikTokWebhookService, Bitrix24WebhookService, ApiKeyGuard],
})
export class WebhooksModule {}
