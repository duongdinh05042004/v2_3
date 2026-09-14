import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

const VN_LOCAL_MOBILE = /^(0)(\d{9})$/;
const DIGITS_ONLY = /^\+?\d[\d\s().-]*$/;

export function sanitizePhoneInput(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || !DIGITS_ONLY.test(trimmed)) {
    return null;
  }
  return trimmed.replace(/[\s().-]/g, '');
}

/**
 * Normalize a phone number to E.164.
 * Vietnamese local numbers (0xxxxxxxxx) default to +84.
 */
export function normalizePhone(
  value: unknown,
  defaultCountry: CountryCode = 'VN',
): string | null {
  const sanitized = sanitizePhoneInput(value);
  if (!sanitized) {
    return null;
  }

  const candidate = VN_LOCAL_MOBILE.test(sanitized)
    ? `+84${sanitized.slice(1)}`
    : sanitized.startsWith('+')
      ? sanitized
      : sanitized;

  const parsed = parsePhoneNumberFromString(candidate, defaultCountry);
  if (!parsed || !parsed.isValid()) {
    return null;
  }
  return parsed.format('E.164');
}

export function isValidE164(value: string | null): boolean {
  if (!value) {
    return false;
  }
  const parsed = parsePhoneNumberFromString(value);
  return Boolean(parsed?.isValid());
}
