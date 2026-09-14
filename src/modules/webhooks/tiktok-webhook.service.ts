import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from '../../common/constants';
import { WebhookEvent } from '../../database/entities/webhook-event.entity';
import { TikTokSignatureService } from '../../integrations/tiktok/tiktok-signature.service';
import { TikTokLeadPayload } from '../leads/lead-normalizer.service';

@Injectable()
export class TikTokWebhookService {
  private readonly logger = new Logger(TikTokWebhookService.name);

  constructor(
    @InjectRepository(WebhookEvent) private readonly events: Repository<WebhookEvent>,
    private readonly signatures: TikTokSignatureService,
    @InjectQueue(QUEUE_NAMES.LEAD_INGESTION) private readonly leadQueue: Queue,
  ) {}

  async handle(
    rawBody: string,
    signatureHeader: string | undefined,
    payload: TikTokLeadPayload,
    headers: Record<string, unknown>,
  ): Promise<{ accepted: boolean; duplicate: boolean; eventId: string }> {
    const verification = this.signatures.verify(rawBody, signatureHeader);
    if (!verification.valid) {
      await this.persist(payload, headers, false, verification.reason ?? 'invalid signature');
      throw new UnauthorizedException(verification.reason ?? 'Invalid TikTok signature');
    }

    const existing = await this.events.findOne({ where: { eventId: payload.event_id } });
    if (existing) {
      this.logger.log(`Duplicate webhook ${payload.event_id} ignored`);
      return { accepted: true, duplicate: true, eventId: payload.event_id };
    }

    await this.persist(payload, headers, true);
    await this.leadQueue.add(
      JOB_NAMES.PROCESS_LEAD,
      { eventId: payload.event_id, payload },
      {
        jobId: `lead-${payload.event_id}`,
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 200,
        removeOnFail: 100,
      },
    );
    return { accepted: true, duplicate: false, eventId: payload.event_id };
  }

  private async persist(
    payload: TikTokLeadPayload,
    headers: Record<string, unknown>,
    signatureValid: boolean,
    processingError?: string,
  ): Promise<void> {
    await this.events.save(
      this.events.create({
        eventId: payload.event_id ?? `anon-${Date.now()}`,
        source: 'tiktok',
        eventType: payload.event ?? 'unknown',
        payload: payload as unknown as Record<string, unknown>,
        headers,
        signatureValid,
        processed: false,
        processingError: processingError ?? null,
      }),
    );
  }
}
