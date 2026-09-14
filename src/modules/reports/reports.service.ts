import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workbook } from 'exceljs';
import { Repository } from 'typeorm';
import { Lead } from '../../database/entities/lead.entity';
import { Deal } from '../../database/entities/deal.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { LessThan } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
    @InjectRepository(Deal) private readonly deals: Repository<Deal>,
    private readonly analytics: AnalyticsService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  async export(format: 'csv' | 'xlsx' | 'json', days = 30): Promise<{
    filename: string;
    mime: string;
    buffer: Buffer;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const leads = await this.leads.find({
      where: { isDuplicate: false },
      order: { createdAt: 'DESC' },
    });
    const filtered = leads.filter((lead) => lead.createdAt >= since);
    const rows = filtered.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phoneE164,
      city: lead.city,
      source: lead.source,
      campaign: lead.campaignName,
      ad: lead.adName,
      status: lead.status,
      qualityScore: lead.qualityScore,
      bitrix24Id: lead.bitrix24Id,
      createdAt: lead.createdAt.toISOString(),
    }));

    if (format === 'json') {
      return {
        filename: `leads-${days}d.json`,
        mime: 'application/json',
        buffer: Buffer.from(JSON.stringify(rows, null, 2)),
      };
    }

    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Leads');
    sheet.columns = Object.keys(rows[0] ?? { id: '' }).map((key) => ({ header: key, key, width: 22 }));
    sheet.addRows(rows);

    if (format === 'csv') {
      const csv = await workbook.csv.writeBuffer();
      return { filename: `leads-${days}d.csv`, mime: 'text/csv', buffer: Buffer.from(csv) };
    }

    const xlsx = await workbook.xlsx.writeBuffer();
    return {
      filename: `leads-${days}d.xlsx`,
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(xlsx),
    };
  }

  async dailyReport(): Promise<void> {
    const conversion = await this.analytics.conversionRates();
    const campaigns = await this.analytics.campaignPerformance();
    await this.notifications.emit('report.daily', { conversion, campaigns });
  }

  async alertStaleLeads(): Promise<number> {
    const hours = this.config.get<number>('report.staleLeadHours') ?? 24;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const stale = await this.leads.find({
      where: { status: 'new', isDuplicate: false, createdAt: LessThan(cutoff) },
    });
    if (stale.length > 0) {
      await this.notifications.emit('alert.stale_leads', {
        count: stale.length,
        ids: stale.map((lead) => lead.id),
      });
    }
    return stale.length;
  }
}
