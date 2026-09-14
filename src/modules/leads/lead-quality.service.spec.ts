import { TIKTOK_EVENTS } from '../../common/constants';
import { LeadQualityService } from './lead-quality.service';

describe('LeadQualityService', () => {
  const service = new LeadQualityService();

  it('scores a complete TikTok lead near the top of the scale', () => {
    const score = service.score({
      emailNormalized: 'a@b.com',
      phoneE164: '+84901234567',
      city: 'Hà Nội',
      ttclid: 'TT-1',
      customQuestions: [
        { question: 'Budget', answer: '5-10' },
        { question: 'Timeline', answer: '1 month' },
      ],
      interests: ['technology', 'mobile apps'],
      engagementType: TIKTOK_EVENTS.FORM_COMPLETE,
    });
    expect(score).toBe(100);
  });

  it('scores a sparse lead lower', () => {
    const score = service.score({ emailNormalized: 'a@b.com' });
    expect(score).toBe(15);
  });
});
