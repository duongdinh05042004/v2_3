import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from '../../common/constants';
import { DeadLetterJob } from '../../database/entities/dead-letter-job.entity';
import { WebhookEvent } from '../../database/entities/webhook-event.entity';
import { DealsService } from '../../modules/deals/deals.service';
import { LeadsService } from '../../modules/leads/leads.service';
import { TikTokLeadPayload } from '../../modules/leads/lead-normalizer.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';

@Processor(QUEUE_NAMES.LEAD_INGESTION)
export class LeadProcessor extends WorkerHost {
  private readonly logger = new Logger(LeadProcessor.name);

  constructor(
    private readonly leads: LeadsService,
    private readonly deals: DealsService,
    private readonly notifications: NotificationsService,
    @InjectRepository(WebhookEvent) private readonly events: Repository<WebhookEvent>,
    @InjectRepository(DeadLetterJob) private readonly dlq: Repository<DeadLetterJob>,
    @InjectQueue(QUEUE_NAMES.BITRIX_SYNC) private readonly bitrixQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<{ eventId: string; payload: TikTokLeadPayload }>): Promise<void> {
    const { eventId, payload } = job.data;
    this.logger.log(`Processing lead job ${job.id} event=${eventId}`);
    const result = await this.leads.ingest(payload);
    await this.events.update({ eventId }, { processed: true, processingError: null });

    if (result.created || result.merged) {
      await this.bitrixQueue.add(
        JOB_NAMES.SYNC_LEAD,
        { leadId: result.lead.id },
        { attempts: 5, backoff: { type: 'exponential', delay: 2000 } },
      );
    }

    if (result.created) {
      await this.notifications.emit('lead.created', {
        leadId: result.lead.id,
        name: result.lead.name,
        qualityScore: result.lead.qualityScore,
      });
      await this.deals.applyRulesIfMatch(result.lead);
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error): Promise<void> {
    if (!job) {
      return;
    }
    this.logger.error(`Lead job ${job.id} failed: ${error.message}`);
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await this.dlq.save(
        this.dlq.create({
          queueName: QUEUE_NAMES.LEAD_INGESTION,
          jobName: job.name,
          payload: job.data as Record<string, unknown>,
          error: error.message,
          attempts: job.attemptsMade,
        }),
      );
    }
  }
}
