import { Injectable } from '@nestjs/common';
import { Lead } from '../../database/entities/lead.entity';
import { NormalizedLead } from './lead-normalizer.service';

/**
 * Merge strategy:
 * - Never overwrite a non-empty existing scalar with empty incoming data.
 * - Incoming non-empty values replace existing values (latest TikTok data wins).
 * - Arrays (interests, custom questions) are unioned.
 * - raw_data keeps both payloads under `history`.
 */
@Injectable()
export class LeadMergeService {
  merge(existing: Lead, incoming: NormalizedLead): Lead {
    existing.name = incoming.name || existing.name;
    existing.email = incoming.email ?? existing.email;
    existing.emailNormalized = incoming.emailNormalized ?? existing.emailNormalized;
    existing.phone = incoming.phone ?? existing.phone;
    existing.phoneE164 = incoming.phoneE164 ?? existing.phoneE164;
    existing.city = incoming.city ?? existing.city;
    existing.campaignId = incoming.campaignId ?? existing.campaignId;
    existing.campaignName = incoming.campaignName ?? existing.campaignName;
    existing.adId = incoming.adId ?? existing.adId;
    existing.adName = incoming.adName ?? existing.adName;
    existing.formId = incoming.formId ?? existing.formId;
    existing.formName = incoming.formName ?? existing.formName;
    existing.advertiserId = incoming.advertiserId ?? existing.advertiserId;
    existing.ttclid = incoming.ttclid ?? existing.ttclid;
    existing.utmSource = incoming.utmSource ?? existing.utmSource;
    existing.utmCampaign = incoming.utmCampaign ?? existing.utmCampaign;
    existing.engagementType = incoming.engagementType ?? existing.engagementType;
    existing.interests = this.uniqueStrings([...(existing.interests ?? []), ...incoming.interests]);
    existing.customQuestions = this.mergeQuestions(existing.customQuestions ?? [], incoming.customQuestions);
    existing.rawData = {
      latest: incoming.rawData,
      history: [
        ...(((existing.rawData?.history as unknown[]) ?? []).slice(-9)),
        existing.rawData?.latest ?? existing.rawData,
      ].filter(Boolean),
    };
    return existing;
  }

  private uniqueStrings(values: string[]): string[] {
    return [...new Set(values.filter(Boolean))];
  }

  private mergeQuestions(
    current: Array<{ question: string; answer: string }>,
    incoming: Array<{ question: string; answer: string }>,
  ): Array<{ question: string; answer: string }> {
    const map = new Map<string, string>();
    for (const item of [...current, ...incoming]) {
      map.set(item.question.toLowerCase(), item.answer);
    }
    return [...map.entries()].map(([question, answer]) => ({ question, answer }));
  }
}
