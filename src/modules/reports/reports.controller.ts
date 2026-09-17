import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { ExportQueryDto } from './dto/export-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiSecurity('api-key')
@ApiHeader({ name: 'x-api-key', required: true })
@UseGuards(ApiKeyGuard)
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
