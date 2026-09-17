import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { APPROVAL_STATUS, DEAL_STATUS } from '../../common/constants';
import { Deal } from '../../database/entities/deal.entity';
import { SalesPerson } from '../../database/entities/sales-person.entity';

export type WorkflowSnapshot = {
  assignedTo: string | null;
  directManager: string | null;
  approvalStatus: string;
  canEdit: boolean;
  canSubmitApproval: boolean;
  canApprove: boolean;
  finalStepLocked: boolean;
};

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(SalesPerson)
    private readonly salesRepo: Repository<SalesPerson>,
  ) {}

  async resolveDirectManager(assigneeExternalId: string | null): Promise<string | null> {
    if (!assigneeExternalId) {
      return null;
    }
    const person = await this.salesRepo.findOne({ where: { externalId: assigneeExternalId } });
    return person?.managerExternalId ?? null;
  }

  canEdit(deal: Deal): boolean {
    if (deal.status === DEAL_STATUS.WON || deal.status === DEAL_STATUS.LOST) {
      return false;
    }
    return deal.approvalStatus !== APPROVAL_STATUS.APPROVED;
  }

  async snapshot(deal: Deal, actorId?: string): Promise<WorkflowSnapshot> {
    const directManager = deal.managerExternalId ?? (await this.resolveDirectManager(deal.assignedTo));
    const finalStepLocked = deal.approvalStatus === APPROVAL_STATUS.APPROVED || deal.status === DEAL_STATUS.WON;
    const canEdit = this.canEdit(deal);
    const isAssignee = Boolean(actorId && deal.assignedTo === actorId);
    const isManager = Boolean(actorId && directManager === actorId);
    return {
      assignedTo: deal.assignedTo,
      directManager,
      approvalStatus: deal.approvalStatus,
      canEdit: canEdit && (isAssignee || isManager),
      canSubmitApproval: canEdit && deal.approvalStatus === APPROVAL_STATUS.DRAFT && isAssignee,
      canApprove: deal.approvalStatus === APPROVAL_STATUS.PENDING_APPROVAL && isManager,
      finalStepLocked,
    };
  }

  assertCanEdit(deal: Deal): void {
    if (!this.canEdit(deal)) {
      throw new ForbiddenException(
        'Deal is locked after final approval. Edits are only allowed before the direct manager approves.',
      );
    }
  }

  async assertCanEditByActor(deal: Deal, actorId: string): Promise<void> {
    this.assertCanEdit(deal);
    const manager = deal.managerExternalId ?? (await this.resolveDirectManager(deal.assignedTo));
    if (deal.assignedTo !== actorId && manager !== actorId) {
      throw new ForbiddenException('Only the assigned salesperson or their direct manager can edit before final approval');
    }
  }

  async assertCanSubmit(deal: Deal, actorId: string): Promise<void> {
    this.assertCanEdit(deal);
    if (deal.approvalStatus !== APPROVAL_STATUS.DRAFT) {
      throw new ForbiddenException('Deal is already submitted or approved');
    }
    if (!deal.assignedTo || deal.assignedTo !== actorId) {
      throw new ForbiddenException('Only the assigned salesperson can submit for approval');
    }
  }

  async assertCanApprove(deal: Deal, actorId: string): Promise<void> {
    if (deal.approvalStatus !== APPROVAL_STATUS.PENDING_APPROVAL) {
      throw new ForbiddenException('Deal is not waiting for manager approval');
    }
    const manager = deal.managerExternalId ?? (await this.resolveDirectManager(deal.assignedTo));
    if (!manager) {
      throw new NotFoundException('Direct manager is not configured for this assignee');
    }
    if (manager !== actorId) {
      throw new ForbiddenException('Only the direct manager can give final approval');
    }
  }
}
