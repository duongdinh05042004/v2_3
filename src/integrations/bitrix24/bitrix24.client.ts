import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BitrixResponse } from './bitrix24.types';

@Injectable()
export class Bitrix24Client {
  private readonly logger = new Logger(Bitrix24Client.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (this.config.get<string>('bitrix24.webhookUrl') ?? '').replace(/\/$/, '');
    this.timeoutMs = this.config.get<number>('bitrix24.timeoutMs') ?? 10000;
  }

  async crmLeadAdd(fields: Record<string, unknown>): Promise<number> {
    const result = await this.call<number>('crm.lead.add', { fields });
    return result;
  }

  async crmLeadUpdate(id: number, fields: Record<string, unknown>): Promise<boolean> {
    return this.call<boolean>('crm.lead.update', { id, fields });
  }

  async crmLeadGet(id: number): Promise<Record<string, unknown>> {
    return this.call<Record<string, unknown>>('crm.lead.get', { id });
  }

  async crmDealAdd(fields: Record<string, unknown>): Promise<number> {
    return this.call<number>('crm.deal.add', { fields });
  }

  async crmDealUpdate(id: number, fields: Record<string, unknown>): Promise<boolean> {
    return this.call<boolean>('crm.deal.update', { id, fields });
  }

  async crmTimelineCommentAdd(params: {
    ENTITY_ID: number;
    ENTITY_TYPE: string;
    COMMENT: string;
  }): Promise<number> {
    return this.call<number>('crm.timeline.comment.add', { fields: params });
  }

  private async call<T>(method: string, params: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}/${method}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new ServiceUnavailableException(`Bitrix24 HTTP ${response.status} on ${method}`);
      }
      const body = (await response.json()) as BitrixResponse<T>;
      if (body.error) {
        throw new ServiceUnavailableException(
          `Bitrix24 error ${body.error}: ${body.error_description ?? 'unknown'}`,
        );
      }
      this.logger.debug(`Bitrix24 ${method} ok`);
      return body.result;
    } catch (error) {
      this.logger.error(`Bitrix24 ${method} failed: ${error instanceof Error ? error.message : error}`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
