import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from '../../common/constants';
import { ReportsService } from '../../modules/reports/reports.service';

@Processor(QUEUE_NAMES.REPORTS)
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(private readonly reports: ReportsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === JOB_NAMES.DAILY_REPORT) {
      await this.reports.dailyReport();
      this.logger.log('Daily report emitted');
      return;
    }
    if (job.name === JOB_NAMES.STALE_LEAD_ALERT) {
      const count = await this.reports.alertStaleLeads();
      this.logger.log(`Stale lead alert count=${count}`);
    }
  }
}
