import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { DEAL_STATUS } from '../../../common/constants';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListDealsDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'open', enum: Object.values(DEAL_STATUS) })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(DEAL_STATUS))
  status?: string;

  @ApiPropertyOptional({ name: 'assigned_to' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  assigned_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  stage?: string;
}
