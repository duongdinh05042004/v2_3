import { TimelineService } from './timeline.service';

describe('TimelineService', () => {
  const repo = {
    create: jest.fn((row: unknown) => row),
    save: jest.fn(async (row: unknown) => row),
    find: jest.fn(async () => [{ eventType: 'created' }]),
  };
  const service = new TimelineService(repo as never);

  it('adds and lists timeline events', async () => {
    await service.add('lead', 'id-1', 'created', 'Lead created', { source: 'tiktok' });
    expect(repo.save).toHaveBeenCalled();
    const items = await service.list('lead', 'id-1');
    expect(items).toHaveLength(1);
  });
});
