import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { LEAD_STATUS } from '../../../common/constants';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListLeadsDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'tiktok' })
  @IsOptional()
  @IsString()
  @IsIn(['tiktok', 'manual', 'import', 'batch'])
  source?: string;

  @ApiPropertyOptional({ example: 'new', enum: Object.values(LEAD_STATUS) })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(LEAD_STATUS))
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  campaignId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
