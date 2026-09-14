import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class DealRuleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: "campaign.campaign_name CONTAINS 'sale'" })
  @IsString()
  condition!: string;

  @ApiProperty({ example: 'create_deal' })
  @IsString()
  action!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pipeline_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
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
  @ValidateNested({ each: true })
  @Type(() => DealRuleDto)
  deal_rules!: DealRuleDto[];
}
