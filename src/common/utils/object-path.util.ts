export function getByPath(source: unknown, path: string): unknown {
  if (source === null || source === undefined || !path) {
    return undefined;
  }
  const parts = path.split('.').filter(Boolean);
  let current: unknown = source;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function setByPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.').filter(Boolean);
  if (parts.length === 0) {
    return;
  }
  let current: Record<string, unknown> = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const next = current[key];
    if (typeof next !== 'object' || next === null || Array.isArray(next)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Bitrix24 uses PHP-style keys such as EMAIL[0][VALUE].
 * We convert them into a nested object that the REST client can flatten.
 */
export function setBitrixField(
  target: Record<string, unknown>,
  field: string,
  value: unknown,
): void {
  const match = field.match(/^([A-Z0-9_]+)(?:\[(\d+)\]\[([A-Z0-9_]+)\])$/i);
  if (!match) {
    target[field] = value;
    return;
  }
  const [, root, index, prop] = match;
  const existing = target[root];
  const list = Array.isArray(existing) ? existing : [];
  const idx = Number(index);
  list[idx] = { ...(list[idx] as Record<string, unknown> | undefined), [prop]: value };
  target[root] = list;
}

export function flattenBitrixFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === 'object') {
          for (const [innerKey, innerValue] of Object.entries(item as Record<string, unknown>)) {
            out[`${key}[${index}][${innerKey}]`] = innerValue;
          }
        }
      });
    } else {
      out[key] = value;
    }
  }
  return out;
}
