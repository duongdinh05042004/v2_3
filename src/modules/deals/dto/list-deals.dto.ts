import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListDealsDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'open' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ name: 'assigned_to' })
  @IsOptional()
  @IsString()
  assigned_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stage?: string;
}
