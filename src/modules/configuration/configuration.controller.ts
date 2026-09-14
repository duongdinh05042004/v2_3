import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateMappingsDto } from './dto/mapping.dto';
import { UpdateRulesDto } from './dto/rules.dto';
import { ConfigurationService } from './configuration.service';

@ApiTags('config')
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
