import { Injectable } from '@nestjs/common';
import { isValidE164 } from '../../common/utils/phone.util';
import { TIKTOK_EVENTS } from '../../common/constants';

export type QualityWeights = {
  hasEmail: number;
  hasPhone: number;
  hasCity: number;
  hasTtclid: number;
  customQuestion: number;
  maxCustomQuestions: number;
  interest: number;
  maxInterests: number;
  formComplete: number;
  validPhone: number;
};

export const DEFAULT_QUALITY_WEIGHTS: QualityWeights = {
  hasEmail: 15,
  hasPhone: 15,
  hasCity: 10,
  hasTtclid: 10,
  customQuestion: 10,
  maxCustomQuestions: 20,
  interest: 5,
  maxInterests: 15,
  formComplete: 15,
  validPhone: 10,
};

export type QualityInput = {
  emailNormalized?: string | null;
  phoneE164?: string | null;
  city?: string | null;
  ttclid?: string | null;
  customQuestions?: Array<{ question: string; answer: string }> | null;
  interests?: string[];
  engagementType?: string | null;
};

@Injectable()
export class LeadQualityService {
  score(input: QualityInput, weights: QualityWeights = DEFAULT_QUALITY_WEIGHTS): number {
    let total = 0;
    if (input.emailNormalized) {
      total += weights.hasEmail;
    }
    if (input.phoneE164) {
      total += weights.hasPhone;
    }
    if (input.city) {
      total += weights.hasCity;
    }
    if (input.ttclid) {
      total += weights.hasTtclid;
    }
    if (isValidE164(input.phoneE164 ?? null)) {
      total += weights.validPhone;
    }
    const questions = input.customQuestions?.length ?? 0;
    total += Math.min(questions * weights.customQuestion, weights.maxCustomQuestions);
    const interests = input.interests?.length ?? 0;
    total += Math.min(interests * weights.interest, weights.maxInterests);
    if (input.engagementType === TIKTOK_EVENTS.FORM_COMPLETE) {
      total += weights.formComplete;
    }
    return Math.min(100, total);
  }
}
