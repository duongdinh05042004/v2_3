import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from '../../common/constants';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { TimelineService } from '../timeline/timeline.service';
import { DealsService } from '../deals/deals.service';
import { BatchImportLeadsDto } from './dto/batch-import.dto';
import { ListLeadsDto } from './dto/list-leads.dto';
import { LeadsService } from './leads.service';

@ApiTags('leads')
@ApiSecurity('api-key')
@ApiHeader({ name: 'x-api-key', required: true })
@UseGuards(ApiKeyGuard)
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leads: LeadsService,
    private readonly deals: DealsService,
    private readonly timeline: TimelineService,
    @InjectQueue(QUEUE_NAMES.BITRIX_SYNC) private readonly bitrixQueue: Queue,
  ) {}

  @Post('batch-import')
  @ApiOperation({ summary: 'Batch import historical TikTok leads for migration' })
  batchImport(@Body() body: BatchImportLeadsDto) {
    return this.leads.batchImport(body.payloads);
  }

  @Get()
  @ApiOperation({ summary: 'List leads with pagination and source filters' })
  list(@Query() query: ListLeadsDto) {
    return this.leads.findAll({
      page: query.page,
      limit: query.limit,
      source: query.source,
      status: query.status,
      campaignId: query.campaignId,
      search: query.search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lead with deals and source tracking' })
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const lead = await this.leads.findOne(id);
    const timeline = await this.timeline.list('lead', id);
    return { lead, timeline };
  }

  @Post(':id/convert-to-deal')
  @ApiOperation({ summary: 'Manually convert a lead into a deal' })
  convert(@Param('id', ParseUUIDPipe) id: string) {
    return this.deals.convertLead(id, true);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Re-queue Bitrix24 lead synchronization' })
  async sync(@Param('id', ParseUUIDPipe) id: string) {
    await this.leads.findOne(id);
    await this.bitrixQueue.add(JOB_NAMES.SYNC_LEAD, { leadId: id });
    return { queued: true };
  }
}
