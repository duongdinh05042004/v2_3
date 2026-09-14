import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from '../../database/entities/deal.entity';
import { SalesPerson } from '../../database/entities/sales-person.entity';
import { RuleEngineService } from '../rules/rule-engine.service';

export type AssignmentConfig = {
  strategy: 'weighted' | 'round_robin';
  rules: Array<{ id: string; condition: string; assign_to: string }>;
  fallback: string;
};

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(SalesPerson)
    private readonly salesRepo: Repository<SalesPerson>,
    @InjectRepository(Deal)
    private readonly dealRepo: Repository<Deal>,
    private readonly rules: RuleEngineService,
  ) {}

  async assign(
    context: Record<string, unknown>,
    config: AssignmentConfig,
  ): Promise<{ assignedTo: string; assignedByRule: string }> {
    for (const rule of config.rules ?? []) {
      if (this.rules.evaluate(context, rule.condition)) {
        const available = await this.ensureCapacity(rule.assign_to);
        if (available) {
          return { assignedTo: rule.assign_to, assignedByRule: rule.id };
        }
      }
    }
    const fallback = await this.pickLeastLoaded(config.fallback);
    return { assignedTo: fallback, assignedByRule: 'fallback' };
  }

  private async ensureCapacity(externalId: string): Promise<boolean> {
    const person = await this.salesRepo.findOne({ where: { externalId, isActive: true } });
    if (!person) {
      return false;
    }
    const open = await this.dealRepo.count({ where: { assignedTo: externalId, status: 'open' } });
    return open < person.maxOpenDeals;
  }

  private async pickLeastLoaded(fallbackId: string): Promise<string> {
    const people = await this.salesRepo.find({ where: { isActive: true } });
    if (people.length === 0) {
      return fallbackId;
    }
    const counts = await Promise.all(
      people.map(async (person) => ({
        id: person.externalId,
        open: await this.dealRepo.count({ where: { assignedTo: person.externalId, status: 'open' } }),
        max: person.maxOpenDeals,
      })),
    );
    const eligible = counts.filter((item) => item.open < item.max);
    const pool = eligible.length > 0 ? eligible : counts;
    pool.sort((a, b) => a.open - b.open);
    return pool[0]?.id ?? fallbackId;
  }
}
