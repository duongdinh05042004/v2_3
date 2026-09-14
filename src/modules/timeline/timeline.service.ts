import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimelineEvent } from '../../database/entities/timeline-event.entity';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(TimelineEvent)
    private readonly repo: Repository<TimelineEvent>,
  ) {}

  async add(
    entityType: string,
    entityId: string,
    eventType: string,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<TimelineEvent> {
    return this.repo.save(
      this.repo.create({
        entityType,
        entityId,
        eventType,
        description,
        metadata: metadata ?? null,
      }),
    );
  }

  async list(entityType: string, entityId: string): Promise<TimelineEvent[]> {
    return this.repo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }
}
