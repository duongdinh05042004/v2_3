import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../common/constants';
import { ConversionEvent } from '../../database/entities/conversion-event.entity';
import { Deal } from '../../database/entities/deal.entity';
import { SalesPerson } from '../../database/entities/sales-person.entity';
import { ConfigurationModule } from '../configuration/configuration.module';
import { LeadsModule } from '../leads/leads.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RulesModule } from '../rules/rules.module';
import { TimelineModule } from '../timeline/timeline.module';
import { AssignmentService } from './assignment.service';
import { DealsService } from './deals.service';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deal, SalesPerson, ConversionEvent]),
    LeadsModule,
    RulesModule,
    ConfigurationModule,
    TimelineModule,
    NotificationsModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.BITRIX_SYNC }, { name: QUEUE_NAMES.TIKTOK_CONVERSION }),
  ],
  providers: [DealsService, AssignmentService, WorkflowService],
  exports: [DealsService, AssignmentService, WorkflowService],
})
export class DealsModule {}
