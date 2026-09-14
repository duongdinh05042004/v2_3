import { BadRequestException, Injectable } from '@nestjs/common';
import { TIKTOK_EVENT_ALIASES } from '../../common/constants';
import { normalizeEmail } from '../../common/utils/email.util';
import { normalizePhone } from '../../common/utils/phone.util';
import { sanitizeString, sanitizeStringArray } from '../../common/utils/sanitize.util';

export type TikTokLeadPayload = {
  event: string;
  event_id: string;
  timestamp: number;
  advertiser_id?: string;
  campaign?: {
    campaign_id?: string;
    campaign_name?: string;
    ad_id?: string;
    ad_name?: string;
  };
  form?: {
    form_id?: string;
    form_name?: string;
  };
  lead_data?: {
    full_name?: string;
    email?: string;
    phone?: string;
    city?: string;
    interests?: string[];
    utm_source?: string;
    utm_campaign?: string;
    ttclid?: string;
  };
  custom_questions?: Array<{ question?: string; answer?: string }>;
};

export type NormalizedLead = {
  externalId: string;
  source: string;
  name: string;
  email: string | null;
  emailNormalized: string | null;
  phone: string | null;
  phoneE164: string | null;
  city: string | null;
  campaignId: string | null;
  campaignName: string | null;
  adId: string | null;
  adName: string | null;
  formId: string | null;
  formName: string | null;
  advertiserId: string | null;
  ttclid: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  interests: string[];
  customQuestions: Array<{ question: string; answer: string }>;
  rawData: Record<string, unknown>;
  engagementType: string;
};

@Injectable()
export class LeadNormalizerService {
  normalize(payload: TikTokLeadPayload): NormalizedLead {
    const event = TIKTOK_EVENT_ALIASES[payload?.event ?? ''];
    if (!event) {
      throw new BadRequestException(`Unsupported TikTok event: ${payload?.event ?? 'unknown'}`);
    }
    if (!payload.event_id) {
      throw new BadRequestException('event_id is required');
    }

    const leadData = payload.lead_data ?? {};
    const name = sanitizeString(leadData.full_name, 255);
    const emailNormalized = normalizeEmail(leadData.email);
    const phoneE164 = normalizePhone(leadData.phone);

    if (!name) {
      throw new BadRequestException('lead_data.full_name is required');
    }
    if (!emailNormalized && !phoneE164) {
      throw new BadRequestException('At least one of email or phone must be valid');
    }

    const customQuestions = (payload.custom_questions ?? [])
      .map((item) => ({
        question: sanitizeString(item.question, 255) ?? '',
        answer: sanitizeString(item.answer, 500) ?? '',
      }))
      .filter((item) => item.question && item.answer);

    return {
      externalId: payload.event_id,
      source: 'tiktok',
      name,
      email: emailNormalized,
      emailNormalized,
      phone: typeof leadData.phone === 'string' ? leadData.phone.trim() : phoneE164,
      phoneE164,
      city: sanitizeString(leadData.city, 255),
      campaignId: sanitizeString(payload.campaign?.campaign_id, 255),
      campaignName: sanitizeString(payload.campaign?.campaign_name, 255),
      adId: sanitizeString(payload.campaign?.ad_id, 255),
      adName: sanitizeString(payload.campaign?.ad_name, 255),
      formId: sanitizeString(payload.form?.form_id, 255),
      formName: sanitizeString(payload.form?.form_name, 255),
      advertiserId: sanitizeString(payload.advertiser_id, 255),
      ttclid: sanitizeString(leadData.ttclid, 255),
      utmSource: sanitizeString(leadData.utm_source, 255),
      utmCampaign: sanitizeString(leadData.utm_campaign, 255),
      interests: sanitizeStringArray(leadData.interests),
      customQuestions,
      rawData: payload as unknown as Record<string, unknown>,
      engagementType: event,
    };
  }
}
