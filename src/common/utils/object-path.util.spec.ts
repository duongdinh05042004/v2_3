import { flattenBitrixFields, getByPath, setBitrixField, setByPath } from './object-path.util';

describe('object-path.util', () => {
  const payload = {
    lead_data: { full_name: 'Nguyễn Văn A', email: 'a@b.com' },
    campaign: { campaign_name: 'Spring Sale 2024' },
  };

  it('reads nested paths', () => {
    expect(getByPath(payload, 'lead_data.full_name')).toBe('Nguyễn Văn A');
    expect(getByPath(payload, 'missing.path')).toBeUndefined();
    expect(getByPath(null, 'a')).toBeUndefined();
  });

  it('writes nested paths', () => {
    const target: Record<string, unknown> = {};
    setByPath(target, 'a.b.c', 1);
    expect(target).toEqual({ a: { b: { c: 1 } } });
  });

  it('maps Bitrix PHP-style fields', () => {
    const fields: Record<string, unknown> = {};
    setBitrixField(fields, 'EMAIL[0][VALUE]', 'a@b.com');
    setBitrixField(fields, 'NAME', 'A');
    expect(fields).toEqual({ EMAIL: [{ VALUE: 'a@b.com' }], NAME: 'A' });
    expect(flattenBitrixFields(fields)).toEqual({
      'EMAIL[0][VALUE]': 'a@b.com',
      NAME: 'A',
    });
  });
});
