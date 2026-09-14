import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TikTokCampaignDto {
  @IsOptional()
  @IsString()
  campaign_id?: string;

  @IsOptional()
  @IsString()
  campaign_name?: string;

  @IsOptional()
  @IsString()
  ad_id?: string;

  @IsOptional()
  @IsString()
  ad_name?: string;
}

export class TikTokFormDto {
  @IsOptional()
  @IsString()
  form_id?: string;

  @IsOptional()
  @IsString()
  form_name?: string;
}

export class TikTokLeadDataDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsString()
  utm_source?: string;

  @IsOptional()
  @IsString()
  utm_campaign?: string;

  @IsOptional()
  @IsString()
  ttclid?: string;
}

export class TikTokCustomQuestionDto {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  answer?: string;
}

export class TikTokWebhookDto {
  @IsString()
  event!: string;

  @IsString()
  event_id!: string;

  @IsNumber()
  timestamp!: number;

  @IsOptional()
  @IsString()
  advertiser_id?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TikTokCampaignDto)
  campaign?: TikTokCampaignDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TikTokFormDto)
  form?: TikTokFormDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TikTokLeadDataDto)
  @IsObject()
  lead_data?: TikTokLeadDataDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TikTokCustomQuestionDto)
  custom_questions?: TikTokCustomQuestionDto[];
}
