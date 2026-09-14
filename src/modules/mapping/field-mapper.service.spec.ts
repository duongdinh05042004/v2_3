import { FieldMapperService } from './field-mapper.service';
import { defaultFieldMapping } from '../../database/seeds/seed-data';
import sample from '../../../mocks/sample-payloads/lead.generate.json';

describe('FieldMapperService', () => {
  const mapper = new FieldMapperService();

  it('maps TikTok sample payload to Bitrix24 fields', () => {
    const fields = mapper.mapToBitrix(sample as unknown as Record<string, unknown>, defaultFieldMapping);
    expect(fields.NAME).toBe('Nguyễn Văn A');
    expect(fields.EMAIL).toEqual([{ VALUE: 'nguyenvana@email.com' }]);
    expect(fields.PHONE).toEqual([{ VALUE: '+84901234567' }]);
    expect(fields.UF_CRM_CITY).toBe('Hà Nội');
    expect(fields.UF_CRM_UTM_CAMPAIGN).toBe('Spring Sale 2024');
    expect(fields.UF_CRM_TTCLID).toBe('TT-abc123xyz789');
  });

  it('skips empty values', () => {
    const fields = mapper.mapToBitrix({ lead_data: { full_name: '' } }, defaultFieldMapping);
    expect(fields.NAME).toBeUndefined();
  });

  it('flattens mapped fields for the REST client', () => {
    const rest = mapper.toRestFields({ EMAIL: [{ VALUE: 'a@b.com' }], NAME: 'A' });
    expect(rest['EMAIL[0][VALUE]']).toBe('a@b.com');
  });
});

