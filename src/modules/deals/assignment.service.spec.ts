import { AssignmentService } from './assignment.service';
import { RuleEngineService } from '../rules/rule-engine.service';

describe('AssignmentService', () => {
  const salesRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const dealRepo = {
    count: jest.fn(),
  };
  const service = new AssignmentService(salesRepo as never, dealRepo as never, new RuleEngineService());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('assigns by the first matching rule when the person has capacity', async () => {
    salesRepo.findOne.mockResolvedValue({ externalId: 'sp_hanoi', maxOpenDeals: 10, isActive: true });
    dealRepo.count.mockResolvedValue(1);
    const result = await service.assign(
      { lead_data: { city: 'Hà Nội' } },
      {
        strategy: 'weighted',
        rules: [{ id: 'assign-hanoi', condition: "lead_data.city EQUALS 'Hà Nội'", assign_to: 'sp_hanoi' }],
        fallback: 'sp_round_robin',
      },
    );
    expect(result).toEqual({ assignedTo: 'sp_hanoi', assignedByRule: 'assign-hanoi' });
  });

  it('falls back to the least loaded salesperson', async () => {
    salesRepo.findOne.mockResolvedValue(null);
    salesRepo.find.mockResolvedValue([
      { externalId: 'sp_a', maxOpenDeals: 10 },
      { externalId: 'sp_b', maxOpenDeals: 10 },
    ]);
    dealRepo.count.mockImplementation(async ({ where }: { where: { assignedTo: string } }) =>
      where.assignedTo === 'sp_a' ? 8 : 1,
    );
    const result = await service.assign(
      { lead_data: { city: 'Hue' } },
      { strategy: 'weighted', rules: [], fallback: 'sp_round_robin' },
    );
    expect(result.assignedTo).toBe('sp_b');
    expect(result.assignedByRule).toBe('fallback');
  });
});
