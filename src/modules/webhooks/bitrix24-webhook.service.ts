import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { safeEqual } from '../../common/utils/timing-safe.util';
import { WebhookEvent } from '../../database/entities/webhook-event.entity';
import { DealsService } from '../deals/deals.service';
import { Bitrix24WebhookDto } from './dto/bitrix24-webhook.dto';

@Injectable()
export class Bitrix24WebhookService {
  private readonly logger = new Logger(Bitrix24WebhookService.name);

  constructor(
    @InjectRepository(WebhookEvent) private readonly events: Repository<WebhookEvent>,
    private readonly deals: DealsService,
    private readonly config: ConfigService,
  ) {}

  async handle(payload: Bitrix24WebhookDto, secret?: string): Promise<{ accepted: boolean }> {
    const expected = this.config.get<string>('bitrix24.webhookSecret') ?? '';
    if (!expected || !secret || !safeEqual(secret, expected)) {
      throw new UnauthorizedException('Invalid or missing Bitrix24 webhook secret');
    }

    const eventId = payload.event_id ?? `b24-${payload.event}-${payload.data?.FIELDS?.ID ?? Date.now()}`;
    await this.events.save(
      this.events.create({
        eventId,
        source: 'bitrix24',
        eventType: payload.event,
        payload: payload as unknown as Record<string, unknown>,
        headers: null,
        signatureValid: true,
        processed: false,
      }),
    );

    const bitrixId = Number(payload.data?.FIELDS?.ID);
    if (!bitrixId || Number.isNaN(bitrixId)) {
      return { accepted: true };
    }

    const stage = payload.data?.FIELDS?.STAGE_ID;
    if (payload.event === 'ONCRMDEALUPDATE' && stage) {
      const deal = await this.deals.findByBitrixId(bitrixId);
      if (deal) {
        const status = stage === 'WON' ? 'won' : stage === 'LOST' ? 'lost' : 'open';
        await this.deals.updateStatus(deal.id, status, stage, undefined, true);
        this.logger.log(`Deal ${deal.id} updated from Bitrix24 stage ${stage}`);
      }
    }
    return { accepted: true };
  }
}
