import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ListDealsDto } from './dto/list-deals.dto';
import { DealsService } from './deals.service';
import { TimelineService } from '../timeline/timeline.service';

class UpdateDealStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  stage?: string;
}

@ApiTags('deals')
@Controller('deals')
export class DealsController {
  constructor(
    private readonly deals: DealsService,
    private readonly timeline: TimelineService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List deals filtered by status and assignee' })
  list(@Query() query: ListDealsDto) {
    return this.deals.findAll({
      page: query.page,
      limit: query.limit,
      status: query.status,
      assignedTo: query.assigned_to,
      stage: query.stage,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal details and timeline' })
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const deal = await this.deals.findOne(id);
    const timeline = await this.timeline.list('deal', id);
    return { deal, timeline };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update deal status (open/won/lost) and pipeline stage' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateDealStatusDto) {
    return this.deals.updateStatus(id, body.status, body.stage);
  }
}
