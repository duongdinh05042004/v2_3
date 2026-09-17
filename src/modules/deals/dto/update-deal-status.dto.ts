import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { DEAL_STATUS } from '../../../common/constants';

export class UpdateDealStatusDto {
  @ApiProperty({ enum: Object.values(DEAL_STATUS) })
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(DEAL_STATUS))
  status!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  stage?: string;
}
