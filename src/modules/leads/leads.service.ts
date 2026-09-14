import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { paginateMeta, PaginatedResult } from '../../common/dto/pagination.dto';
import { LEAD_STATUS, SYNC_STATUS } from '../../common/constants';
import { Lead } from '../../database/entities/lead.entity';
import { Campaign } from '../../database/entities/campaign.entity';
import { ConfigurationService } from '../configuration/configuration.service';
import { TimelineService } from '../timeline/timeline.service';
import { LeadMergeService } from './lead-merge.service';
import { LeadNormalizerService, NormalizedLead, TikTokLeadPayload } from './lead-normalizer.service';
import { LeadQualityService } from './lead-quality.service';

export type LeadQuery = {
  page: number;
  limit: number;
  source?: string;
  status?: string;
  campaignId?: string;
  search?: string;
};

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead) private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Campaign) private readonly campaignRepo: Repository<Campaign>,
    private readonly normalizer: LeadNormalizerService,
    private readonly merger: LeadMergeService,
    private readonly quality: LeadQualityService,
    private readonly config: ConfigurationService,
    private readonly timeline: TimelineService,
  ) {}

  async ingest(payload: TikTokLeadPayload): Promise<{ lead: Lead; created: boolean; merged: boolean }> {
    const normalized = this.normalizer.normalize(payload);
    const existingByExternal = await this.leadRepo.findOne({ where: { externalId: normalized.externalId } });
    if (existingByExternal) {
      return { lead: existingByExternal, created: false, merged: false };
    }

    const duplicate = await this.findDuplicate(normalized);
    const weights = await this.config.getQualityWeights();
    const qualityScore = this.quality.score(normalized, weights);

    if (duplicate) {
      this.merger.merge(duplicate, normalized);
      duplicate.qualityScore = Math.max(duplicate.qualityScore, qualityScore);
      const saved = await this.leadRepo.save(duplicate);
      await this.timeline.add('lead', saved.id, 'merged', 'Incoming TikTok lead merged into existing record', {
        incomingEventId: normalized.externalId,
      });
      await this.upsertCampaign(normalized);
      return { lead: saved, created: false, merged: true };
    }

    const lead = this.leadRepo.create({
      ...normalized,
      qualityScore,
      status: qualityScore >= 70 ? LEAD_STATUS.QUALIFIED : LEAD_STATUS.NEW,
      bitrix24SyncStatus: SYNC_STATUS.PENDING,
    });
    const saved = await this.leadRepo.save(lead);
    await this.timeline.add('lead', saved.id, 'created', 'Lead created from TikTok webhook', {
      source: saved.source,
      campaignId: saved.campaignId,
      qualityScore: saved.qualityScore,
    });
    await this.upsertCampaign(normalized);
    return { lead: saved, created: true, merged: false };
  }

  async findDuplicate(normalized: NormalizedLead): Promise<Lead | null> {
    if (normalized.emailNormalized) {
      const byEmail = await this.leadRepo.findOne({
        where: { emailNormalized: normalized.emailNormalized, isDuplicate: false },
      });
      if (byEmail) {
        return byEmail;
      }
    }
    if (normalized.phoneE164) {
      return this.leadRepo.findOne({
        where: { phoneE164: normalized.phoneE164, isDuplicate: false },
      });
    }
    return null;
  }

  async findAll(query: LeadQuery): Promise<PaginatedResult<Lead>> {
    const where: FindOptionsWhere<Lead> = { isDuplicate: false };
    if (query.source) {
      where.source = query.source;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.campaignId) {
      where.campaignId = query.campaignId;
    }

    const qb = this.leadRepo.createQueryBuilder('lead').where(where);
    if (query.search) {
      qb.andWhere('(lead.name ILIKE :q OR lead.email ILIKE :q OR lead.phone ILIKE :q)', {
        q: `%${query.search}%`,
      });
    }
    qb.orderBy('lead.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: paginateMeta(total, query.page, query.limit) };
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.leadRepo.findOne({ where: { id }, relations: ['deals'] });
    if (!lead) {
      throw new NotFoundException(`Lead ${id} not found`);
    }
    return lead;
  }

  async markSynced(id: string, bitrix24Id: number): Promise<Lead> {
    const lead = await this.findOne(id);
    lead.bitrix24Id = bitrix24Id;
    lead.bitrix24SyncStatus = SYNC_STATUS.SYNCED;
    lead.bitrix24SyncError = null;
    return this.leadRepo.save(lead);
  }

  async markSyncFailed(id: string, error: string): Promise<void> {
    await this.leadRepo.update(id, {
      bitrix24SyncStatus: SYNC_STATUS.FAILED,
      bitrix24SyncError: error,
    });
  }

  async markConverted(id: string): Promise<void> {
    await this.leadRepo.update(id, { status: LEAD_STATUS.CONVERTED });
  }

  async searchByName(name: string): Promise<Lead[]> {
    return this.leadRepo.find({ where: { name: ILike(`%${name}%`) }, take: 20 });
  }

  async batchImport(payloads: TikTokLeadPayload[]): Promise<{
    total: number;
    created: number;
    merged: number;
    failed: Array<{ eventId: string; error: string }>;
  }> {
    let created = 0;
    let merged = 0;
    const failed: Array<{ eventId: string; error: string }> = [];
    for (const payload of payloads) {
      try {
        const result = await this.ingest(payload);
        if (result.created) {
          created += 1;
        }
        if (result.merged) {
          merged += 1;
        }
      } catch (error) {
        failed.push({
          eventId: payload.event_id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return { total: payloads.length, created, merged, failed };
  }

  private async upsertCampaign(normalized: NormalizedLead): Promise<void> {
    if (!normalized.campaignId) {
      return;
    }
    const existing = await this.campaignRepo.findOne({ where: { campaignId: normalized.campaignId } });
    if (existing) {
      existing.campaignName = normalized.campaignName ?? existing.campaignName;
      existing.advertiserId = normalized.advertiserId ?? existing.advertiserId;
      await this.campaignRepo.save(existing);
      return;
    }
    await this.campaignRepo.save(
      this.campaignRepo.create({
        campaignId: normalized.campaignId,
        campaignName: normalized.campaignName,
        advertiserId: normalized.advertiserId,
        spend: '0',
      }),
    );
  }
}
