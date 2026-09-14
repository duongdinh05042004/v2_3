import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from '../../database/entities/lead.entity';
import { Bitrix24Module } from '../../integrations/bitrix24/bitrix24.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { DealsModule } from '../deals/deals.module';
import { LeadsModule } from '../leads/leads.module';
import { MappingModule } from '../mapping/mapping.module';
import { TimelineModule } from '../timeline/timeline.module';
import { BitrixSyncService } from './bitrix-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead]),
    Bitrix24Module,
    MappingModule,
    ConfigurationModule,
    LeadsModule,
    DealsModule,
    TimelineModule,
  ],
  providers: [BitrixSyncService],
  exports: [BitrixSyncService],
})
export class SyncModule {}
