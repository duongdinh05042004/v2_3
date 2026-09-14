import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_KEYS } from '../../common/constants';
import { AppCacheService } from '../../cache/cache.service';
import { Lead } from '../../database/entities/lead.entity';
import { Deal } from '../../database/entities/deal.entity';
import { Campaign } from '../../database/entities/campaign.entity';
import { ConfigurationService } from '../configuration/configuration.service';

export type ConversionRates = {
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  leadToDealRate: number;
  dealWonRate: number;
  overallWonRate: number;
};

export type CampaignPerformance = {
  campaignId: string;
  campaignName: string | null;
  leads: number;
  deals: number;
  wonDeals: number;
  revenue: number;
  spend: number;
  costPerLead: number;
  roi: number;
  avgQualityScore: number;
};

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
    @InjectRepository(Deal) private readonly deals: Repository<Deal>,
    @InjectRepository(Campaign) private readonly campaigns: Repository<Campaign>,
    private readonly cache: AppCacheService,
    private readonly config: ConfigurationService,
  ) {}

  async conversionRates(): Promise<ConversionRates> {
    return this.cache.wrap(CACHE_KEYS.CONVERSION_RATES, () => this.computeConversionRates(), 60);
  }

  async campaignPerformance(): Promise<CampaignPerformance[]> {
    return this.cache.wrap(CACHE_KEYS.CAMPAIGN_PERF, () => this.computeCampaignPerformance(), 60);
  }

  async dashboard(): Promise<{
    conversion: ConversionRates;
    campaigns: CampaignPerformance[];
    generatedAt: string;
  }> {
    return this.cache.wrap(
      CACHE_KEYS.DASHBOARD,
      async () => ({
        conversion: await this.computeConversionRates(),
        campaigns: await this.computeCampaignPerformance(),
        generatedAt: new Date().toISOString(),
      }),
      30,
    );
  }

  async computeConversionRates(): Promise<ConversionRates> {
    const totalLeads = await this.leads.count({ where: { isDuplicate: false } });
    const qualifiedLeads = await this.leads.count({ where: { status: 'qualified', isDuplicate: false } });
    const convertedLeads = await this.leads.count({ where: { status: 'converted', isDuplicate: false } });
    const openDeals = await this.deals.count({ where: { status: 'open' } });
    const wonDeals = await this.deals.count({ where: { status: 'won' } });
    const lostDeals = await this.deals.count({ where: { status: 'lost' } });
    const totalDeals = openDeals + wonDeals + lostDeals;
    return {
      totalLeads,
      qualifiedLeads,
      convertedLeads,
      openDeals,
      wonDeals,
      lostDeals,
      leadToDealRate: this.rate(convertedLeads, totalLeads),
      dealWonRate: this.rate(wonDeals, totalDeals),
      overallWonRate: this.rate(wonDeals, totalLeads),
    };
  }

  async computeCampaignPerformance(): Promise<CampaignPerformance[]> {
    const costs = await this.config.getCampaignCosts();
    const rows = await this.leads
      .createQueryBuilder('lead')
      .leftJoin(Deal, 'deal', 'deal.lead_id = lead.id')
      .select('lead.campaign_id', 'campaignId')
      .addSelect('MAX(lead.campaign_name)', 'campaignName')
      .addSelect('COUNT(DISTINCT lead.id)', 'leads')
      .addSelect(`COUNT(DISTINCT deal.id)`, 'deals')
      .addSelect(`COUNT(DISTINCT CASE WHEN deal.status = 'won' THEN deal.id END)`, 'wonDeals')
      .addSelect(`COALESCE(SUM(CASE WHEN deal.status = 'won' THEN deal.amount ELSE 0 END), 0)`, 'revenue')
      .addSelect('AVG(lead.quality_score)', 'avgQualityScore')
      .where('lead.is_duplicate = false')
      .andWhere('lead.campaign_id IS NOT NULL')
      .groupBy('lead.campaign_id')
      .getRawMany<{
        campaignId: string;
        campaignName: string;
        leads: string;
        deals: string;
        wonDeals: string;
        revenue: string;
        avgQualityScore: string;
      }>();

    const campaignRows = await this.campaigns.find();
    const spendById = new Map(campaignRows.map((item) => [item.campaignId, Number(item.spend)]));

    return rows.map((row) => {
      const leads = Number(row.leads);
      const spend = spendById.get(row.campaignId) ?? costs[row.campaignId]?.spend ?? 0;
      const revenue = Number(row.revenue);
      return {
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        leads,
        deals: Number(row.deals),
        wonDeals: Number(row.wonDeals),
        revenue,
        spend,
        costPerLead: leads === 0 ? 0 : Number((spend / leads).toFixed(2)),
        roi: spend === 0 ? 0 : Number(((revenue - spend) / spend).toFixed(4)),
        avgQualityScore: Number(Number(row.avgQualityScore).toFixed(2)),
      };
    });
  }

  rate(part: number, total: number): number {
    if (!total) {
      return 0;
    }
    return Number(((part / total) * 100).toFixed(2));
  }
}
