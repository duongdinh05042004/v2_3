import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../src/common/constants';
import { ApiKeyGuard } from '../src/common/guards/api-key.guard';
import { appValidationPipe } from '../src/common/pipes/app-validation.pipe';
import { LeadsController } from '../src/modules/leads/leads.controller';
import { LeadsService } from '../src/modules/leads/leads.service';
import { DealsService } from '../src/modules/deals/deals.service';
import { TimelineService } from '../src/modules/timeline/timeline.service';

describe('Leads API (e2e)', () => {
  let app: INestApplication<App>;
  const apiKey = 'test-api-key-123';
  const leads = {
    findAll: jest.fn(async () => ({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } })),
    findOne: jest.fn(async () => ({ id: '11111111-1111-1111-1111-111111111111', name: 'A' })),
    batchImport: jest.fn(async () => ({ total: 0, created: 0, merged: 0, failed: [] })),
  };
  const deals = { convertLead: jest.fn(async () => ({ id: 'deal-1' })) };
  const timeline = { list: jest.fn(async () => []) };
  const queue = { add: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ apiKey })],
        }),
      ],
      controllers: [LeadsController],
      providers: [
        ApiKeyGuard,
        { provide: LeadsService, useValue: leads },
        { provide: DealsService, useValue: deals },
        { provide: TimelineService, useValue: timeline },
        { provide: getQueueToken(QUEUE_NAMES.BITRIX_SYNC), useValue: queue },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(appValidationPipe);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests without x-api-key', async () => {
    await request(app.getHttpServer()).get('/api/v1/leads?page=1&limit=10').expect(401);
  });

  it('GET /api/v1/leads lists leads', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/leads?page=1&limit=10&source=tiktok')
      .set('x-api-key', apiKey)
      .expect(200);
    expect(leads.findAll).toHaveBeenCalled();
  });

  it('POST /api/v1/leads/:id/convert-to-deal converts a lead', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/leads/11111111-1111-1111-1111-111111111111/convert-to-deal')
      .set('x-api-key', apiKey)
      .expect(201);
    expect(deals.convertLead).toHaveBeenCalled();
  });

  it('rejects an invalid batch-import body', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/leads/batch-import')
      .set('x-api-key', apiKey)
      .send({ payloads: { event: 'lead.generate' } })
      .expect(400);
    expect(leads.batchImport).not.toHaveBeenCalled();
  });
});
