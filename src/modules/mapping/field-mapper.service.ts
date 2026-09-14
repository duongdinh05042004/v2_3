import { Injectable } from '@nestjs/common';
import { flattenBitrixFields, getByPath, setBitrixField } from '../../common/utils/object-path.util';

export type FieldMapping = Record<string, string>;

@Injectable()
export class FieldMapperService {
  mapToBitrix(payload: Record<string, unknown>, mapping: FieldMapping): Record<string, unknown> {
    const fields: Record<string, unknown> = {};
    for (const [sourcePath, bitrixField] of Object.entries(mapping)) {
      const value = getByPath(payload, sourcePath);
      if (value === undefined || value === null || value === '') {
        continue;
      }
      setBitrixField(fields, bitrixField, value);
    }
    return fields;
  }

  toRestFields(fields: Record<string, unknown>): Record<string, unknown> {
    return flattenBitrixFields(fields);
  }
}
