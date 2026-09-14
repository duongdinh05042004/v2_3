import { Lead } from '../../database/entities/lead.entity';
import { LeadMergeService } from './lead-merge.service';
import { NormalizedLead } from './lead-normalizer.service';

describe('LeadMergeService', () => {
  const service = new LeadMergeService();

  it('merges incoming values without dropping previous history', () => {
    const existing = {
      name: 'Old',
      email: 'old@mail.com',
      emailNormalized: 'old@mail.com',
      city: 'Hue',
      interests: ['fashion'],
      customQuestions: [{ question: 'timeline', answer: 'later' }],
      rawData: { latest: { event_id: 'old' } },
    } as unknown as Lead;

    const incoming = {
      name: 'Nguyễn Văn A',
      email: 'new@mail.com',
      emailNormalized: 'new@mail.com',
      phoneE164: '+84901234567',
      city: 'Hà Nội',
      interests: ['technology'],
      customQuestions: [{ question: 'Budget', answer: '5-10' }],
      rawData: { event_id: 'new' },
      engagementType: 'lead.generate',
    } as unknown as NormalizedLead;

    const merged = service.merge(existing, incoming);
    expect(merged.name).toBe('Nguyễn Văn A');
    expect(merged.emailNormalized).toBe('new@mail.com');
    expect(merged.city).toBe('Hà Nội');
    expect(merged.interests).toEqual(expect.arrayContaining(['fashion', 'technology']));
    expect(merged.customQuestions).toHaveLength(2);
    expect((merged.rawData as { latest: { event_id: string } }).latest.event_id).toBe('new');
  });
});
