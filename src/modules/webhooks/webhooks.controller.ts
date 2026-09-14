import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { TikTokWebhookDto } from './dto/tiktok-webhook.dto';
import { Bitrix24WebhookService, BitrixDealWebhook } from './bitrix24-webhook.service';
import { TikTokWebhookService } from './tiktok-webhook.service';

@ApiTags('webhooks')
@ApiExcludeController()
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly tiktok: TikTokWebhookService,
    private readonly bitrix: Bitrix24WebhookService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 300, ttl: 60000 } })
  @Post('tiktok/leads')
  @ApiOperation({ summary: 'TikTok Lead Generation webhook receiver' })
  receiveTikTok(
    @Req() req: Request,
    @Headers('tiktok-signature') signature: string | undefined,
    @Body() body: TikTokWebhookDto,
  ) {
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(body);
    return this.tiktok.handle(rawBody, signature, body, {
      'user-agent': req.header('user-agent'),
      'content-type': req.header('content-type'),
    });
  }

  @Public()
  @Throttle({ default: { limit: 300, ttl: 60000 } })
  @Post('bitrix24/deals')
  @ApiOperation({ summary: 'Bitrix24 deal status webhook receiver' })
  receiveBitrix(
    @Headers('x-bitrix-secret') secret: string | undefined,
    @Body() body: BitrixDealWebhook,
  ) {
    return this.bitrix.handle(body, secret);
  }
}
