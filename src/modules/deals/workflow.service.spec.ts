import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { APPROVAL_STATUS, DEAL_STATUS } from '../../common/constants';
import { Deal } from '../../database/entities/deal.entity';
import { WorkflowService } from './workflow.service';

describe('WorkflowService', () => {
  const salesRepo = {
    findOne: jest.fn(),
  };
  const service = new WorkflowService(salesRepo as never);

  const deal = (overrides: Partial<Deal> = {}): Deal =>
    ({
      id: 'deal-1',
      assignedTo: 'sp_tech',
      managerExternalId: 'sp_manager',
      approvalStatus: APPROVAL_STATUS.DRAFT,
      status: DEAL_STATUS.OPEN,
      ...overrides,
    }) as Deal;

  beforeEach(() => {
    jest.clearAllMocks();
    salesRepo.findOne.mockResolvedValue({ externalId: 'sp_tech', managerExternalId: 'sp_manager' });
  });

  it('resolves the direct manager from the sales person record', async () => {
    await expect(service.resolveDirectManager('sp_tech')).resolves.toBe('sp_manager');
    await expect(service.resolveDirectManager(null)).resolves.toBeNull();
  });

  it('allows edits before final approval and locks afterwards', () => {
    expect(service.canEdit(deal())).toBe(true);
    expect(service.canEdit(deal({ approvalStatus: APPROVAL_STATUS.PENDING_APPROVAL }))).toBe(true);
    expect(service.canEdit(deal({ approvalStatus: APPROVAL_STATUS.APPROVED }))).toBe(false);
    expect(service.canEdit(deal({ status: DEAL_STATUS.WON }))).toBe(false);
  });

  it('exposes submit rights only to the assignee and approve rights only to the manager', async () => {
    const assigneeView = await service.snapshot(deal(), 'sp_tech');
    expect(assigneeView.directManager).toBe('sp_manager');
    expect(assigneeView.canEdit).toBe(true);
    expect(assigneeView.canSubmitApproval).toBe(true);
    expect(assigneeView.canApprove).toBe(false);

    const managerView = await service.snapshot(
      deal({ approvalStatus: APPROVAL_STATUS.PENDING_APPROVAL }),
      'sp_manager',
    );
    expect(managerView.canApprove).toBe(true);
    expect(managerView.canSubmitApproval).toBe(false);
  });

  it('rejects submit/approve/edit from the wrong actor', async () => {
    await expect(service.assertCanSubmit(deal(), 'sp_hanoi')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.assertCanApprove(deal({ approvalStatus: APPROVAL_STATUS.PENDING_APPROVAL }), 'sp_tech'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.assertCanEditByActor(deal(), 'stranger')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires a configured direct manager before final approval', async () => {
    salesRepo.findOne.mockResolvedValue({ externalId: 'sp_tech', managerExternalId: null });
    await expect(
      service.assertCanApprove(
        deal({ approvalStatus: APPROVAL_STATUS.PENDING_APPROVAL, managerExternalId: null }),
        'sp_manager',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
