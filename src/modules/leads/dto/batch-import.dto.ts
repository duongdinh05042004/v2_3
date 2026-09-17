import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TikTokWebhookDto } from '../../webhooks/dto/tiktok-webhook.dto';

export class BatchImportLeadsDto {
  @ApiProperty({ type: [TikTokWebhookDto] })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => TikTokWebhookDto)
  payloads!: TikTokWebhookDto[];
}
