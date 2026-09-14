import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { QUEUE_NAMES } from '../src/common/constants';
import { LeadsController } from '../src/modules/leads/leads.controller';
import { LeadsService } from '../src/modules/leads/leads.service';
import { DealsService } from '../src/modules/deals/deals.service';
import { TimelineService } from '../src/modules/timeline/timeline.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('Leads API (e2e)', () => {
  let app: INestApplication<App>;
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
      controllers: [LeadsController],
      providers: [
        { provide: LeadsService, useValue: leads },
        { provide: DealsService, useValue: deals },
        { provide: TimelineService, useValue: timeline },
        { provide: getQueueToken(QUEUE_NAMES.BITRIX_SYNC), useValue: queue },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/leads lists leads', async () => {
    await request(app.getHttpServer()).get('/api/v1/leads?page=1&limit=10&source=tiktok').expect(200);
    expect(leads.findAll).toHaveBeenCalled();
  });

  it('POST /api/v1/leads/:id/convert-to-deal converts a lead', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/leads/11111111-1111-1111-1111-111111111111/convert-to-deal')
      .expect(201);
    expect(deals.convertLead).toHaveBeenCalled();
  });
});
