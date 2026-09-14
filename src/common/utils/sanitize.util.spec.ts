import { sanitizeString, sanitizeStringArray } from './sanitize.util';

describe('sanitize.util', () => {
  it('strips HTML and control characters', () => {
    expect(sanitizeString('<b>Hi</b>\u0000')).toBe('Hi');
    expect(sanitizeString('   ')).toBeNull();
    expect(sanitizeString(1)).toBeNull();
  });

  it('sanitizes arrays and caps length', () => {
    expect(sanitizeStringArray(['tech', '<x>app</x>', 1, 'ok'])).toEqual(['tech', 'app', 'ok']);
    expect(sanitizeStringArray('nope')).toEqual([]);
  });
});
