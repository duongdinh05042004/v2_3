const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const HTML_TAGS = /<\/?[^>]+>/g;

export function sanitizeString(value: unknown, maxLength = 500): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const cleaned = value.replace(HTML_TAGS, '').replace(CONTROL_CHARS, '').trim();
  if (!cleaned) {
    return null;
  }
  return cleaned.slice(0, maxLength);
}

export function sanitizeStringArray(value: unknown, maxItems = 20): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => sanitizeString(item, 100))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems);
}
