import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class TikTokCampaignDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  campaign_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  campaign_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ad_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ad_name?: string;
}

export class TikTokFormDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  form_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  form_name?: string;
}

export class TikTokLeadDataDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  interests?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  utm_source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  utm_campaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ttclid?: string;
}

export class TikTokCustomQuestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  question?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  answer?: string;
}

export class TikTokWebhookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  event!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  event_id!: string;

  @IsInt()
  @Min(0)
  @Max(4_102_444_800)
  timestamp!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
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
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => TikTokCustomQuestionDto)
  custom_questions?: TikTokCustomQuestionDto[];
}
