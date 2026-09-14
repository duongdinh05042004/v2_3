import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ConfigService } from '@nestjs/config';
import { TikTokSignatureService } from '../src/integrations/tiktok/tiktok-signature.service';
import { TikTokWebhookService } from '../src/modules/webhooks/tiktok-webhook.service';
import { WebhooksController } from '../src/modules/webhooks/webhooks.controller';
import { Bitrix24WebhookService } from '../src/modules/webhooks/bitrix24-webhook.service';
import sample from '../mocks/sample-payloads/lead.generate.json';

describe('Webhooks (e2e)', () => {
  let app: INestApplication<App>;
  const handle = jest.fn(async () => ({ accepted: true, duplicate: false, eventId: 'evt' }));
  const bitrixHandle = jest.fn(async () => ({ accepted: true }));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        { provide: TikTokWebhookService, useValue: { handle } },
        { provide: Bitrix24WebhookService, useValue: { handle: bitrixHandle } },
        {
          provide: ConfigService,
          useValue: { get: () => 'secret' },
        },
        TikTokSignatureService,
      ],
    }).compile();

    app = moduleRef.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /webhooks/tiktok/leads accepts the sample payload', async () => {
    await request(app.getHttpServer())
      .post('/webhooks/tiktok/leads')
      .set('TikTok-Signature', 't=1,s=abc')
      .send(sample)
      .expect(201);
    expect(handle).toHaveBeenCalled();
  });

  it('POST /webhooks/bitrix24/deals accepts deal updates', async () => {
    await request(app.getHttpServer())
      .post('/webhooks/bitrix24/deals')
      .send({ event: 'ONCRMDEALUPDATE', data: { FIELDS: { ID: 1, STAGE_ID: 'WON' } } })
      .expect(201);
    expect(bitrixHandle).toHaveBeenCalled();
  });
});
