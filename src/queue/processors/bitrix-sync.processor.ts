import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '../../common/constants';
import { DeadLetterJob } from '../../database/entities/dead-letter-job.entity';
import { BitrixSyncService } from '../../modules/sync/bitrix-sync.service';

@Processor(QUEUE_NAMES.BITRIX_SYNC)
export class BitrixSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(BitrixSyncProcessor.name);

  constructor(
    private readonly sync: BitrixSyncService,
    @InjectRepository(DeadLetterJob) private readonly dlq: Repository<DeadLetterJob>,
  ) {
    super();
  }

  async process(job: Job<{ leadId?: string; dealId?: string }>): Promise<void> {
    if (job.data.leadId) {
      const bitrixId = await this.sync.syncLead(job.data.leadId);
      this.logger.log(`Lead ${job.data.leadId} synced as Bitrix24 #${bitrixId}`);
    }
    if (job.data.dealId) {
      const bitrixId = await this.sync.syncDeal(job.data.dealId);
      this.logger.log(`Deal ${job.data.dealId} synced as Bitrix24 #${bitrixId}`);
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error): Promise<void> {
    if (!job) {
      return;
    }
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await this.dlq.save(
        this.dlq.create({
          queueName: QUEUE_NAMES.BITRIX_SYNC,
          jobName: job.name,
          payload: job.data,
          error: error.message,
          attempts: job.attemptsMade,
        }),
      );
    }
  }
}
