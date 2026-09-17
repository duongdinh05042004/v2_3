import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';

export class ExportQueryDto {
  @ApiPropertyOptional({ enum: ['csv', 'xlsx', 'json'], default: 'csv' })
  @IsOptional()
  @IsIn(['csv', 'xlsx', 'json'])
  format: 'csv' | 'xlsx' | 'json' = 'csv';

  @ApiPropertyOptional({ example: '30d', description: 'Lookback window, 1–365 days' })
  @IsOptional()
  @Matches(/^(?:[1-9]|[1-9]\d|[12]\d{2}|3[0-5]\d|36[0-5])d$/, {
    message: 'date_range must be {1-365}d, e.g. 30d',
  })
  date_range = '30d';
}
