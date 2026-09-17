import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class DealRuleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  id?: string;

  @ApiProperty({ example: "campaign.campaign_name CONTAINS 'sale'" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  condition!: string;

  @ApiProperty({ example: 'create_deal', enum: ['create_deal'] })
  @IsString()
  @IsIn(['create_deal'])
  action!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  pipeline_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  stage_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateRulesDto {
  @ApiProperty({
    type: [DealRuleDto],
    example: [
      {
        condition: "campaign.campaign_name CONTAINS 'sale'",
        action: 'create_deal',
        pipeline_id: '1',
        stage_id: 'NEW',
        probability: 30,
      },
    ],
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => DealRuleDto)
  deal_rules!: DealRuleDto[];
}
