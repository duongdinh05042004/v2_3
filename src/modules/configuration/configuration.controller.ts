import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { UpdateMappingsDto } from './dto/mapping.dto';
import { UpdateRulesDto } from './dto/rules.dto';
import { ConfigurationService } from './configuration.service';

@ApiTags('config')
@ApiSecurity('api-key')
@ApiHeader({ name: 'x-api-key', required: true })
@UseGuards(ApiKeyGuard)
@Controller('config')
export class ConfigurationController {
  constructor(private readonly config: ConfigurationService) {}

  @Get('mappings')
  @ApiOperation({ summary: 'GET /api/v1/config/mappings' })
  async getMappings() {
    return { field_mapping: await this.config.getMappings() };
  }

  @Put('mappings')
  @ApiOperation({ summary: 'PUT /api/v1/config/mappings' })
  async saveMappings(@Body() body: UpdateMappingsDto) {
    return { field_mapping: await this.config.saveMappings(body.field_mapping) };
  }

  @Get('rules')
  @ApiOperation({ summary: 'GET /api/v1/config/rules' })
  async getRules() {
    return { deal_rules: await this.config.getRules() };
  }

  @Put('rules')
  @ApiOperation({ summary: 'PUT /api/v1/config/rules' })
  async saveRules(@Body() body: UpdateRulesDto) {
    return { deal_rules: await this.config.saveRules(body.deal_rules) };
  }
}
