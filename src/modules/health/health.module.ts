import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [ApiKeyGuard],
})
export class HealthModule {}
