import { isValidE164, normalizePhone, sanitizePhoneInput } from './phone.util';

describe('phone.util', () => {
  it('sanitizes spaced and dashed numbers', () => {
    expect(sanitizePhoneInput('+84 90 123 4567')).toBe('+84901234567');
    expect(sanitizePhoneInput('090-123-4567')).toBe('0901234567');
    expect(sanitizePhoneInput('not-a-phone')).toBeNull();
    expect(sanitizePhoneInput(123)).toBeNull();
  });

  it('normalizes Vietnamese local numbers to E.164', () => {
    expect(normalizePhone('0901234567')).toBe('+84901234567');
    expect(normalizePhone('+84 901 234 567')).toBe('+84901234567');
  });

  it('rejects invalid numbers', () => {
    expect(normalizePhone('123')).toBeNull();
    expect(normalizePhone('')).toBeNull();
    expect(isValidE164(null)).toBe(false);
    expect(isValidE164('+84901234567')).toBe(true);
  });
});
