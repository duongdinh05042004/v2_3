import { paginateMeta } from './pagination.dto';

describe('paginateMeta', () => {
  it('computes total pages', () => {
    expect(paginateMeta(25, 2, 10)).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 });
    expect(paginateMeta(0, 1, 10).totalPages).toBe(0);
  });
});
