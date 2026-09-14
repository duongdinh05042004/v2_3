import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { Response } from 'express';
import { ReportsService } from './reports.service';

class ExportQueryDto {
  @IsOptional()
  @IsIn(['csv', 'xlsx', 'json'])
  format: 'csv' | 'xlsx' | 'json' = 'csv';

  @IsOptional()
  @IsString()
  @Matches(/^\d+d$/)
  date_range = '30d';
}

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('export')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Export lead data as CSV, Excel or JSON' })
  async export(@Query() query: ExportQueryDto, @Res() res: Response): Promise<void> {
    const days = parseInt(query.date_range.replace('d', ''), 10);
    const file = await this.reports.export(query.format, days);
    res.setHeader('Content-Type', file.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
  }
}
