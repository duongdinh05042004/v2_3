import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../common/constants';
import { Campaign } from '../../database/entities/campaign.entity';
import { Lead } from '../../database/entities/lead.entity';
import { ConfigurationModule } from '../configuration/configuration.module';
import { TimelineModule } from '../timeline/timeline.module';
import { LeadMergeService } from './lead-merge.service';
import { LeadNormalizerService } from './lead-normalizer.service';
import { LeadQualityService } from './lead-quality.service';
import { LeadsService } from './leads.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, Campaign]),
    ConfigurationModule,
    TimelineModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.BITRIX_SYNC }),
  ],
  providers: [LeadsService, LeadNormalizerService, LeadMergeService, LeadQualityService],
  exports: [LeadsService, LeadNormalizerService, LeadMergeService, LeadQualityService],
})
export class LeadsModule {}
