import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { UpdateMappingsDto } from '../../modules/configuration/dto/mapping.dto';
import { UpdateRulesDto } from '../../modules/configuration/dto/rules.dto';
import { UpdateDealDto } from '../../modules/deals/dto/update-deal.dto';
import { UpdateDealStatusDto } from '../../modules/deals/dto/update-deal-status.dto';
import { BatchImportLeadsDto } from '../../modules/leads/dto/batch-import.dto';
import { TikTokWebhookDto } from '../../modules/webhooks/dto/tiktok-webhook.dto';

const samplePayload = {
  event: 'lead.generate',
  event_id: 'evt_1234567890',
  timestamp: 1709876543,
  advertiser_id: '7123456789',
  campaign: { campaign_id: '1', campaign_name: 'Spring Sale 2024' },
  form: { form_id: 'form_abc123', form_name: 'Contact Form' },
  lead_data: {
    full_name: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    phone: '+84901234567',
    city: 'Hà Nội',
    interests: ['technology'],
    ttclid: 'TT-abc123xyz789',
  },
  custom_questions: [{ question: 'Budget range', answer: '5-10 triệu VND' }],
};

function flatten(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...flatten(error.children ?? []),
  ]);
}

async function errorsOf(cls: new () => object, payload: object): Promise<string[]> {
  const instance = plainToInstance(cls, payload);
  return flatten(await validate(instance, { whitelist: true, forbidNonWhitelisted: true }));
}

describe('API request body DTOs', () => {
  it('accepts the official TikTok sample payload', async () => {
    const errors = await validate(plainToInstance(TikTokWebhookDto, samplePayload));
    expect(errors).toHaveLength(0);
  });

  it('rejects a mapping that is not string-to-string', async () => {
    const messages = await errorsOf(UpdateMappingsDto, { field_mapping: { NAME: 1 } });
    expect(messages.join(' ')).toMatch(/string/i);
  });

  it('rejects deal rules with an unknown action', async () => {
    const messages = await errorsOf(UpdateRulesDto, {
      deal_rules: [{ condition: "city EQUALS 'Hà Nội'", action: 'delete_all' }],
    });
    expect(messages.join(' ')).toMatch(/create_deal|action/i);
  });

  it('rejects an empty deal patch and invalid amount', async () => {
    expect(await errorsOf(UpdateDealDto, {})).not.toHaveLength(0);
    expect(await errorsOf(UpdateDealDto, { amount: 'abc' })).not.toHaveLength(0);
    expect(await errorsOf(UpdateDealDto, { title: 'Spring Sale' })).toHaveLength(0);
  });

  it('only allows open/won/lost deal status', async () => {
    expect(await errorsOf(UpdateDealStatusDto, { status: 'maybe' })).not.toHaveLength(0);
    expect(await errorsOf(UpdateDealStatusDto, { status: 'won', stage: 'WON' })).toHaveLength(0);
  });

  it('validates batch-import as an array of TikTok payloads', async () => {
    expect(await errorsOf(BatchImportLeadsDto, { payloads: samplePayload })).not.toHaveLength(0);
    expect(await errorsOf(BatchImportLeadsDto, { payloads: [samplePayload] })).toHaveLength(0);
  });
});
