import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { Configuration } from '../../database/entities/configuration.entity';
import { ConfigurationController } from './configuration.controller';
import { ConfigurationService } from './configuration.service';

@Module({
  imports: [TypeOrmModule.forFeature([Configuration])],
  controllers: [ConfigurationController],
  providers: [ConfigurationService, ApiKeyGuard],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
