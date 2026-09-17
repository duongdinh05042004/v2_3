import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { APPROVAL_STATUS, DEAL_STATUS, JOB_NAMES, QUEUE_NAMES, SYNC_STATUS } from '../../common/constants';
import { paginateMeta, PaginatedResult } from '../../common/dto/pagination.dto';
import { Deal } from '../../database/entities/deal.entity';
import { Lead } from '../../database/entities/lead.entity';
import { ConversionEvent } from '../../database/entities/conversion-event.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AssignmentService } from './assignment.service';
import { ConfigurationService } from '../configuration/configuration.service';
import { RuleEngineService } from '../rules/rule-engine.service';
import { TimelineService } from '../timeline/timeline.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LeadsService } from '../leads/leads.service';
import { WorkflowService } from './workflow.service';
import { UpdateDealDto } from './dto/update-deal.dto';

export type DealQuery = {
  page: number;
  limit: number;
  status?: string;
  assignedTo?: string;
  stage?: string;
};

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal) private readonly dealRepo: Repository<Deal>,
    @InjectRepository(ConversionEvent) private readonly conversionRepo: Repository<ConversionEvent>,
    @InjectQueue(QUEUE_NAMES.BITRIX_SYNC) private readonly bitrixQueue: Queue,
    @InjectQueue(QUEUE_NAMES.TIKTOK_CONVERSION) private readonly conversionQueue: Queue,
    private readonly leads: LeadsService,
    private readonly rules: RuleEngineService,
    private readonly assignment: AssignmentService,
    private readonly config: ConfigurationService,
    private readonly timeline: TimelineService,
    private readonly notifications: NotificationsService,
    private readonly workflow: WorkflowService,
  ) {}

  async convertLead(leadId: string, force = false): Promise<Deal> {
    const lead = await this.leads.findOne(leadId);
    const existing = await this.dealRepo.findOne({ where: { leadId: lead.id, status: DEAL_STATUS.OPEN } });
    if (existing && !force) {
      throw new ConflictException(`Lead ${leadId} already has an open deal`);
    }

    const context = this.buildContext(lead);
    const rules = await this.config.getRules();
    const matched = this.rules.evaluateAll(context, rules);
    const createRule = matched.find((rule) => rule.action === 'create_deal');
    if (!createRule && !force) {
      throw new ConflictException('No deal conversion rule matched this lead');
    }

    const pipeline = await this.config.getPipeline();
    const stageId = createRule?.stage_id ?? 'NEW';
    const stage = pipeline.stages.find((item) => item.id === stageId);
    const assignmentConfig = await this.config.getAssignment();
    const assigned = await this.assignment.assign(context, assignmentConfig);
    const managerExternalId = await this.workflow.resolveDirectManager(assigned.assignedTo);

    const deal = await this.dealRepo.save(
      this.dealRepo.create({
        leadId: lead.id,
        title: `${lead.campaignName ?? 'TikTok'} - ${lead.name}`,
        amount: this.extractBudget(lead),
        currency: 'VND',
        pipelineId: createRule?.pipeline_id ?? '1',
        stage: stageId,
        probability: createRule?.probability ?? stage?.probability ?? 10,
        status: DEAL_STATUS.OPEN,
        assignedTo: assigned.assignedTo,
        assignedByRule: assigned.assignedByRule,
        managerExternalId,
        approvalStatus: APPROVAL_STATUS.DRAFT,
        bitrix24SyncStatus: SYNC_STATUS.PENDING,
      }),
    );

    await this.leads.markConverted(lead.id);
    await this.timeline.add('deal', deal.id, 'created', 'Deal created from conversion rule', {
      ruleId: createRule?.id ?? 'manual',
      assignedTo: assigned.assignedTo,
      managerExternalId,
    });
    await this.timeline.add('lead', lead.id, 'converted', 'Lead converted to deal', { dealId: deal.id });
    await this.notifications.emit('deal.created', {
      dealId: deal.id,
      leadId: lead.id,
      assignedTo: assigned.assignedTo,
      title: deal.title,
    });

    await this.bitrixQueue.add(JOB_NAMES.SYNC_DEAL, { dealId: deal.id }, { attempts: 5, backoff: { type: 'exponential', delay: 2000 } });
    return deal;
  }

  async applyRulesIfMatch(lead: Lead): Promise<Deal | null> {
    const context = this.buildContext(lead);
    const rules = await this.config.getRules();
    const matched = this.rules.evaluateAll(context, rules).filter((rule) => rule.action === 'create_deal');
    if (matched.length === 0) {
      return null;
    }
    const existing = await this.dealRepo.findOne({ where: { leadId: lead.id } });
    if (existing) {
      return existing;
    }
    return this.convertLead(lead.id, true);
  }

  async findAll(query: DealQuery): Promise<PaginatedResult<Deal>> {
    const where: FindOptionsWhere<Deal> = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.assignedTo) {
      where.assignedTo = query.assignedTo;
    }
    if (query.stage) {
      where.stage = query.stage;
    }
    const [data, total] = await this.dealRepo.findAndCount({
      where,
      relations: ['lead'],
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { data, meta: paginateMeta(total, query.page, query.limit) };
  }

  async findOne(id: string): Promise<Deal> {
    const deal = await this.dealRepo.findOne({ where: { id }, relations: ['lead'] });
    if (!deal) {
      throw new NotFoundException(`Deal ${id} not found`);
    }
    return deal;
  }

  async getWorkflow(id: string, actorId?: string) {
    const deal = await this.findOne(id);
    return this.workflow.snapshot(deal, actorId);
  }

  async updateDeal(id: string, patch: UpdateDealDto, actorId: string): Promise<Deal> {
    const deal = await this.findOne(id);
    await this.workflow.assertCanEditByActor(deal, actorId);
    if (patch.title !== undefined) {
      deal.title = patch.title;
    }
    if (patch.amount !== undefined) {
      deal.amount = patch.amount;
    }
    if (patch.stage !== undefined) {
      deal.stage = patch.stage;
    }
    const saved = await this.dealRepo.save(deal);
    await this.timeline.add('deal', saved.id, 'edited', 'Deal edited before final approval', {
      actorId,
      patch,
    });
    await this.bitrixQueue.add(JOB_NAMES.SYNC_DEAL, { dealId: saved.id }, { attempts: 5, backoff: { type: 'exponential', delay: 2000 } });
    return saved;
  }

  async submitApproval(id: string, actorId: string): Promise<Deal> {
    const deal = await this.findOne(id);
    await this.workflow.assertCanSubmit(deal, actorId);
    deal.approvalStatus = APPROVAL_STATUS.PENDING_APPROVAL;
    deal.submittedBy = actorId;
    if (!deal.managerExternalId) {
      deal.managerExternalId = await this.workflow.resolveDirectManager(deal.assignedTo);
    }
    const saved = await this.dealRepo.save(deal);
    await this.timeline.add('deal', saved.id, 'submitted_for_approval', 'Deal submitted to the direct manager', {
      actorId,
      managerExternalId: saved.managerExternalId,
    });
    await this.notifications.emit('deal.submitted_for_approval', {
      dealId: saved.id,
      submittedBy: actorId,
      managerExternalId: saved.managerExternalId,
    });
    return saved;
  }

  async approve(id: string, actorId: string): Promise<Deal> {
    const deal = await this.findOne(id);
    await this.workflow.assertCanApprove(deal, actorId);
    deal.approvalStatus = APPROVAL_STATUS.APPROVED;
    deal.approvedBy = actorId;
    deal.approvedAt = new Date();
    const saved = await this.dealRepo.save(deal);
    await this.timeline.add('deal', saved.id, 'approved', 'Direct manager gave final approval', { actorId });
    await this.notifications.emit('deal.approved', {
      dealId: saved.id,
      approvedBy: actorId,
      assignedTo: saved.assignedTo,
    });
    return saved;
  }

  async updateStatus(
    id: string,
    status: string,
    stage?: string,
    actorId?: string,
    skipApproval = false,
  ): Promise<Deal> {
    const deal = await this.findOne(id);
    if (status === DEAL_STATUS.WON && !skipApproval) {
      if (deal.approvalStatus !== APPROVAL_STATUS.APPROVED) {
        throw new ForbiddenException('Direct manager must give final approval before the deal can be marked won');
      }
    } else if (status !== DEAL_STATUS.LOST && !skipApproval) {
      if (actorId) {
        await this.workflow.assertCanEditByActor(deal, actorId);
      } else {
        this.workflow.assertCanEdit(deal);
      }
    }

    deal.status = status;
    if (stage) {
      deal.stage = stage;
    }
    if (status === DEAL_STATUS.WON || status === DEAL_STATUS.LOST) {
      deal.closedAt = new Date();
      deal.probability = status === DEAL_STATUS.WON ? 100 : 0;
    }
    const saved = await this.dealRepo.save(deal);
    await this.timeline.add('deal', saved.id, 'status_changed', `Deal status changed to ${status}`, { stage, actorId });

    if (status === DEAL_STATUS.WON && deal.lead?.ttclid) {
      const conversion = await this.conversionRepo.save(
        this.conversionRepo.create({
          leadId: deal.leadId,
          dealId: deal.id,
          eventName: 'CompletePayment',
          ttclid: deal.lead.ttclid,
          payload: { amount: deal.amount, currency: deal.currency },
          syncStatus: SYNC_STATUS.PENDING,
        }),
      );
      await this.conversionQueue.add(
        JOB_NAMES.SEND_CONVERSION,
        { conversionId: conversion.id },
        { attempts: 5, backoff: { type: 'exponential', delay: 3000 } },
      );
      await this.notifications.emit('deal.won', { dealId: deal.id, amount: deal.amount });
    }
    return saved;
  }

  async markSynced(id: string, bitrix24Id: number): Promise<void> {
    await this.dealRepo.update(id, { bitrix24Id, bitrix24SyncStatus: SYNC_STATUS.SYNCED });
  }

  async findByBitrixId(bitrix24Id: number): Promise<Deal | null> {
    return this.dealRepo.findOne({ where: { bitrix24Id }, relations: ['lead'] });
  }

  buildContext(lead: Lead): Record<string, unknown> {
    return {
      campaign: {
        campaign_id: lead.campaignId,
        campaign_name: lead.campaignName,
        ad_id: lead.adId,
        ad_name: lead.adName,
      },
      form: { form_id: lead.formId, form_name: lead.formName },
      lead_data: {
        full_name: lead.name,
        email: lead.email,
        phone: lead.phoneE164,
        city: lead.city,
        interests: lead.interests,
        ttclid: lead.ttclid,
      },
      custom_questions: lead.customQuestions,
      quality_score: lead.qualityScore,
      source: lead.source,
    };
  }

  private extractBudget(lead: Lead): string | null {
    const budget = lead.customQuestions?.find((item) => /budget/i.test(item.question))?.answer;
    if (!budget) {
      return null;
    }
    const match = budget.match(/(\d+)/);
    if (!match) {
      return null;
    }
    const amount = Number(match[1]);
    if (budget.toLowerCase().includes('triệu')) {
      return String(amount * 1_000_000);
    }
    return String(amount);
  }
}
