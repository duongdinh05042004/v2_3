import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { ListDealsDto } from './dto/list-deals.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { UpdateDealStatusDto } from './dto/update-deal-status.dto';
import { DealsService } from './deals.service';
import { TimelineService } from '../timeline/timeline.service';

function requireActor(actorId?: string): string {
  const value = actorId?.trim();
  if (!value) {
    throw new BadRequestException('Header x-actor-id is required (sales person external id)');
  }
  if (value.length > 255 || !/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new BadRequestException('x-actor-id must be a sales person external id');
  }
  return value;
}

@ApiTags('deals')
@ApiSecurity('api-key')
@ApiHeader({ name: 'x-api-key', required: true })
@UseGuards(ApiKeyGuard)
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

  @Get(':id/workflow')
  @ApiOperation({
    summary: 'Resolve the direct manager and edit/approve rights for a deal',
  })
  @ApiHeader({ name: 'x-actor-id', required: false, description: 'Sales person external id of the caller' })
  getWorkflow(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-actor-id') actorId?: string,
  ) {
    return this.deals.getWorkflow(id, actorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal details and timeline' })
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const deal = await this.deals.findOne(id);
    const timeline = await this.timeline.list('deal', id);
    return { deal, timeline };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit deal fields before final manager approval' })
  @ApiHeader({ name: 'x-actor-id', required: true, description: 'Assignee or direct manager external id' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-actor-id') actorId: string | undefined,
    @Body() body: UpdateDealDto,
  ) {
    return this.deals.updateDeal(id, body, requireActor(actorId));
  }

  @Post(':id/submit-approval')
  @ApiOperation({ summary: 'Assignee submits the deal to their direct manager' })
  @ApiHeader({ name: 'x-actor-id', required: true, description: 'Assigned salesperson external id' })
  submitApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-actor-id') actorId: string | undefined,
  ) {
    return this.deals.submitApproval(id, requireActor(actorId));
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Direct manager gives final approval; deal becomes read-only except won/lost' })
  @ApiHeader({ name: 'x-actor-id', required: true, description: 'Direct manager external id' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-actor-id') actorId: string | undefined,
  ) {
    return this.deals.approve(id, requireActor(actorId));
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update deal status (open/won/lost) and pipeline stage. Won requires final approval.' })
  @ApiHeader({ name: 'x-actor-id', required: false, description: 'Actor performing the status change' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-actor-id') actorId: string | undefined,
    @Body() body: UpdateDealStatusDto,
  ) {
    return this.deals.updateStatus(id, body.status, body.stage, actorId);
  }
}
