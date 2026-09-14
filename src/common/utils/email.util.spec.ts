import { isValidEmail, normalizeEmail } from './email.util';

describe('email.util', () => {
  it('normalizes email to lowercase trimmed value', () => {
    expect(normalizeEmail('  NGUYEN@Email.COM ')).toBe('nguyen@email.com');
  });

  it('rejects invalid emails', () => {
    expect(normalizeEmail('plainaddress')).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail('user@example.com')).toBe(true);
  });
});
