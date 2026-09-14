import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_NAMES, SYNC_STATUS } from '../../common/constants';
import { ConversionEvent } from '../../database/entities/conversion-event.entity';
import { DeadLetterJob } from '../../database/entities/dead-letter-job.entity';
import { TikTokEventsService } from '../../integrations/tiktok/tiktok-events.service';

@Processor(QUEUE_NAMES.TIKTOK_CONVERSION)
export class ConversionProcessor extends WorkerHost {
  private readonly logger = new Logger(ConversionProcessor.name);

  constructor(
    @InjectRepository(ConversionEvent) private readonly conversions: Repository<ConversionEvent>,
    @InjectRepository(DeadLetterJob) private readonly dlq: Repository<DeadLetterJob>,
    private readonly tiktok: TikTokEventsService,
  ) {
    super();
  }

  async process(job: Job<{ conversionId: string }>): Promise<void> {
    const conversion = await this.conversions.findOneByOrFail({ id: job.data.conversionId });
    const result = await this.tiktok.sendConversion({
      event: conversion.eventName,
      event_id: conversion.id,
      timestamp: new Date().toISOString(),
      context: { ad: { callback: conversion.ttclid ?? '' } },
      properties: conversion.payload ?? undefined,
    });
    conversion.syncStatus = result.ok ? SYNC_STATUS.SYNCED : SYNC_STATUS.FAILED;
    conversion.syncedAt = result.ok ? new Date() : null;
    await this.conversions.save(conversion);
    this.logger.log(`Conversion ${conversion.id} sync=${conversion.syncStatus}`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error): Promise<void> {
    if (!job) {
      return;
    }
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await this.dlq.save(
        this.dlq.create({
          queueName: QUEUE_NAMES.TIKTOK_CONVERSION,
          jobName: job.name,
          payload: job.data,
          error: error.message,
          attempts: job.attemptsMade,
        }),
      );
    }
  }
}
