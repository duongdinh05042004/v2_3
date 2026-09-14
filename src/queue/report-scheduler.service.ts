import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from '../common/constants';

@Injectable()
export class ReportSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.REPORTS) private readonly reports: Queue,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.reports.upsertJobScheduler(
      'daily-report',
      { pattern: this.config.get<string>('report.cron') ?? '0 8 * * *' },
      { name: JOB_NAMES.DAILY_REPORT },
    );
    await this.reports.upsertJobScheduler(
      'stale-lead-alert',
      { pattern: '0 * * * *' },
      { name: JOB_NAMES.STALE_LEAD_ALERT },
    );
    this.logger.log('Report schedulers registered');
  }
}
