import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_KEYS, CONFIG_KEYS } from '../../common/constants';
import { AppCacheService } from '../../cache/cache.service';
import { Configuration } from '../../database/entities/configuration.entity';
import { FieldMapping } from '../mapping/field-mapper.service';
import { DealRule } from '../rules/rule-engine.service';
import { AssignmentConfig } from '../deals/assignment.service';
import { QualityWeights } from '../leads/lead-quality.service';

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectRepository(Configuration)
    private readonly repo: Repository<Configuration>,
    private readonly cache: AppCacheService,
  ) {}

  async getMappings(): Promise<FieldMapping> {
    return this.cache.wrap(CACHE_KEYS.MAPPINGS, () => this.getValue<FieldMapping>(CONFIG_KEYS.FIELD_MAPPING, {}), 300);
  }

  async saveMappings(mapping: FieldMapping): Promise<FieldMapping> {
    await this.upsert(CONFIG_KEYS.FIELD_MAPPING, mapping, 'TikTok to Bitrix24 field mapping');
    await this.cache.del(CACHE_KEYS.MAPPINGS);
    return mapping;
  }

  async getRules(): Promise<DealRule[]> {
    return this.cache.wrap(CACHE_KEYS.RULES, () => this.getValue<DealRule[]>(CONFIG_KEYS.DEAL_RULES, []), 300);
  }

  async saveRules(rules: DealRule[]): Promise<DealRule[]> {
    await this.upsert(CONFIG_KEYS.DEAL_RULES, rules, 'Lead to Deal conversion rules');
    await this.cache.del(CACHE_KEYS.RULES);
    return rules;
  }

  async getAssignment(): Promise<AssignmentConfig> {
    return this.cache.wrap(
      CACHE_KEYS.ASSIGNMENT,
      () =>
        this.getValue<AssignmentConfig>(CONFIG_KEYS.ASSIGNMENT_RULES, {
          strategy: 'weighted',
          rules: [],
          fallback: 'sp_round_robin',
        }),
      300,
    );
  }

  async getPipeline(): Promise<{ stages: Array<{ id: string; name: string; probability: number }> }> {
    return this.cache.wrap(
      CACHE_KEYS.PIPELINE,
      () => this.getValue(CONFIG_KEYS.PIPELINE, { stages: [] }),
      300,
    );
  }

  async getQualityWeights(): Promise<QualityWeights> {
    return this.getValue(CONFIG_KEYS.QUALITY_WEIGHTS, {
      hasEmail: 15,
      hasPhone: 15,
      hasCity: 10,
      hasTtclid: 10,
      customQuestion: 10,
      maxCustomQuestions: 20,
      interest: 5,
      maxInterests: 15,
      formComplete: 15,
      validPhone: 10,
    });
  }

  async getCampaignCosts(): Promise<Record<string, { spend: number; currency: string }>> {
    return this.getValue(CONFIG_KEYS.CAMPAIGN_COSTS, {});
  }

  private async getValue<T>(key: string, fallback: T): Promise<T> {
    const row = await this.repo.findOne({ where: { key } });
    return (row?.value as T) ?? fallback;
  }

  private async upsert(key: string, value: unknown, description: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { key } });
    if (existing) {
      existing.value = value;
      existing.description = description;
      await this.repo.save(existing);
      return;
    }
    await this.repo.save(this.repo.create({ key, value, description }));
  }
}
