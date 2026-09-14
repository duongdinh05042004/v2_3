import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimelineEvent } from '../../database/entities/timeline-event.entity';
import { TimelineService } from './timeline.service';

@Module({
  imports: [TypeOrmModule.forFeature([TimelineEvent])],
  providers: [TimelineService],
  exports: [TimelineService],
})
export class TimelineModule {}
