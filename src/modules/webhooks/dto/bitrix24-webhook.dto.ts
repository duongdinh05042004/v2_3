import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class Bitrix24WebhookDto {
  @ApiProperty({ example: 'ONCRMDEALUPDATE' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  event!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  event_id?: string;

  @ApiPropertyOptional({
    example: { FIELDS: { ID: '1', STAGE_ID: 'WON' } },
  })
  @IsOptional()
  @IsObject()
  data?: {
    FIELDS?: {
      ID?: number | string;
      STAGE_ID?: string;
      OPPORTUNITY?: string;
    };
  };

  /** Bitrix inbound webhooks often include these extra envelope fields. */
  @ApiPropertyOptional()
  @IsOptional()
  @Allow()
  ts?: string | number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  auth?: Record<string, unknown>;
}
