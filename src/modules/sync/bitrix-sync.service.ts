import { Injectable, Logger } from '@nestjs/common';
import { Bitrix24Client } from '../../integrations/bitrix24/bitrix24.client';
import { FieldMapperService } from '../mapping/field-mapper.service';
import { ConfigurationService } from '../configuration/configuration.service';
import { LeadsService } from '../leads/leads.service';
import { DealsService } from '../deals/deals.service';
import { TimelineService } from '../timeline/timeline.service';
import { SYNC_STATUS } from '../../common/constants';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../../database/entities/lead.entity';

@Injectable()
export class BitrixSyncService {
  private readonly logger = new Logger(BitrixSyncService.name);

  constructor(
    private readonly bitrix: Bitrix24Client,
    private readonly mapper: FieldMapperService,
    private readonly config: ConfigurationService,
    private readonly leads: LeadsService,
    private readonly deals: DealsService,
    private readonly timeline: TimelineService,
    @InjectRepository(Lead) private readonly leadRepo: Repository<Lead>,
  ) {}

  async syncLead(leadId: string): Promise<number> {
    const lead = await this.leads.findOne(leadId);
    await this.leadRepo.update(leadId, { bitrix24SyncStatus: SYNC_STATUS.SYNCING });
    const mapping = await this.config.getMappings();
    const payload = (lead.rawData?.latest as Record<string, unknown>) ?? lead.rawData ?? {};
    const fields = this.mapper.mapToBitrix(payload, mapping);
    fields.SOURCE_ID = 'WEB';
    fields.SOURCE_DESCRIPTION = `TikTok campaign ${lead.campaignName ?? lead.campaignId ?? ''}`;
    fields.UF_CRM_QUALITY_SCORE = lead.qualityScore;
    fields.COMMENTS = this.buildComments(lead);

    try {
      let bitrixId = lead.bitrix24Id;
      if (bitrixId) {
        await this.bitrix.crmLeadUpdate(bitrixId, fields);
      } else {
        bitrixId = await this.bitrix.crmLeadAdd(fields);
      }
      await this.bitrix.crmTimelineCommentAdd({
        ENTITY_ID: bitrixId,
        ENTITY_TYPE: 'lead',
        COMMENT: `Synced from TikTok event ${lead.externalId}. Quality score: ${lead.qualityScore}. Source campaign: ${lead.campaignName ?? 'n/a'}`,
      });
      await this.leads.markSynced(lead.id, bitrixId);
      await this.timeline.add('lead', lead.id, 'bitrix_synced', 'Lead synchronized to Bitrix24', { bitrixId });
      return bitrixId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.leads.markSyncFailed(lead.id, message);
      throw error;
    }
  }

  async syncDeal(dealId: string): Promise<number> {
    const deal = await this.deals.findOne(dealId);
    const fields: Record<string, unknown> = {
      TITLE: deal.title,
      OPPORTUNITY: deal.amount,
      CURRENCY_ID: deal.currency,
      STAGE_ID: deal.stage,
      PROBABILITY: deal.probability,
      SOURCE_ID: 'WEB',
      COMMENTS: `Created from TikTok lead ${deal.leadId}`,
    };
    if (deal.lead?.bitrix24Id) {
      fields.LEAD_ID = deal.lead.bitrix24Id;
    }
    let bitrixId = deal.bitrix24Id;
    if (bitrixId) {
      await this.bitrix.crmDealUpdate(bitrixId, fields);
    } else {
      bitrixId = await this.bitrix.crmDealAdd(fields);
    }
    await this.deals.markSynced(deal.id, bitrixId);
    await this.timeline.add('deal', deal.id, 'bitrix_synced', 'Deal synchronized to Bitrix24', { bitrixId });
    return bitrixId;
  }

  private buildComments(lead: { interests: string[]; customQuestions: Array<{ question: string; answer: string }> | null }): string {
    const interests = lead.interests?.length ? `Interests: ${lead.interests.join(', ')}` : '';
    const questions = (lead.customQuestions ?? [])
      .map((item) => `${item.question}: ${item.answer}`)
      .join('\n');
    return [interests, questions].filter(Boolean).join('\n');
  }
}
