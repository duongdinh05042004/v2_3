import { BadRequestException } from '@nestjs/common';
import { LeadNormalizerService, TikTokLeadPayload } from './lead-normalizer.service';
import sample from '../../../mocks/sample-payloads/lead.generate.json';

describe('LeadNormalizerService', () => {
  const service = new LeadNormalizerService();

  it('normalizes the official sample payload', () => {
    const lead = service.normalize(sample as unknown as TikTokLeadPayload);
    expect(lead.name).toBe('Nguyễn Văn A');
    expect(lead.emailNormalized).toBe('nguyenvana@email.com');
    expect(lead.phoneE164).toBe('+84901234567');
    expect(lead.campaignId).toBe('1234567890123456789');
    expect(lead.customQuestions).toHaveLength(2);
    expect(lead.source).toBe('tiktok');
  });

  it('accepts the assignment event name lead submission', () => {
    const lead = service.normalize({
      ...(sample as unknown as TikTokLeadPayload),
      event: 'lead.submission',
      event_id: 'evt_alias',
    });
    expect(lead.engagementType).toBe('lead.generate');
  });

  it('rejects unsupported events and missing identity', () => {
    expect(() => service.normalize({ event: 'unknown', event_id: '1', timestamp: 1 })).toThrow(
      BadRequestException,
    );
    expect(() =>
      service.normalize({
        event: 'lead.generate',
        event_id: '',
        timestamp: 1,
        lead_data: { full_name: 'A' },
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      service.normalize({
        event: 'lead.generate',
        event_id: '2',
        timestamp: 1,
        lead_data: { full_name: 'A', email: 'bad' },
      }),
    ).toThrow(BadRequestException);
  });
});
