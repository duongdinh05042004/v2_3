import { Module } from '@nestjs/common';
import { TikTokEventsService } from './tiktok-events.service';
import { TikTokSignatureService } from './tiktok-signature.service';

@Module({
  providers: [TikTokSignatureService, TikTokEventsService],
  exports: [TikTokSignatureService, TikTokEventsService],
})
export class TikTokModule {}
