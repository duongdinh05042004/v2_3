import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../common/constants';
import { DealsController } from '../deals/deals.controller';
import { DealsModule } from '../deals/deals.module';
import { LeadsController } from '../leads/leads.controller';
import { LeadsModule } from '../leads/leads.module';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [
    LeadsModule,
    DealsModule,
    TimelineModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.BITRIX_SYNC }),
  ],
  controllers: [LeadsController, DealsController],
})
export class CrmModule {}
