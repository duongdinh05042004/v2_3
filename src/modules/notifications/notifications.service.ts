import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    private readonly config: ConfigService,
  ) {}

  async emit(eventType: string, payload: Record<string, unknown>): Promise<Notification> {
    const notification = await this.repo.save(
      this.repo.create({
        channel: this.config.get<string>('notify.webhookUrl') ? 'webhook' : 'log',
        eventType,
        payload,
        status: 'pending',
      }),
    );
    await this.dispatch(notification);
    return notification;
  }

  private async dispatch(notification: Notification): Promise<void> {
    const webhookUrl = this.config.get<string>('notify.webhookUrl');
    if (!webhookUrl) {
      this.logger.log(`[${notification.eventType}] ${JSON.stringify(notification.payload)}`);
      notification.status = 'sent';
      notification.sentAt = new Date();
      await this.repo.save(notification);
      return;
    }
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: notification.eventType,
          payload: notification.payload,
          from: this.config.get<string>('notify.emailFrom'),
        }),
      });
      notification.status = 'sent';
      notification.sentAt = new Date();
    } catch (error) {
      notification.status = 'failed';
      this.logger.error(`Notification dispatch failed: ${error instanceof Error ? error.message : error}`);
    }
    await this.repo.save(notification);
  }
}
