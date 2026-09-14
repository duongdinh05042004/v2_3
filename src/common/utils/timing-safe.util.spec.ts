import { safeEqual } from './timing-safe.util';

describe('timing-safe.util', () => {
  it('compares equal secrets', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
  });

  it('rejects different length or content', () => {
    expect(safeEqual('abc', 'ab')).toBe(false);
    expect(safeEqual('abc', 'abd')).toBe(false);
  });
});
