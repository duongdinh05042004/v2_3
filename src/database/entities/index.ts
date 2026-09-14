import { Campaign } from './campaign.entity';
import { Configuration } from './configuration.entity';
import { ConversionEvent } from './conversion-event.entity';
import { DeadLetterJob } from './dead-letter-job.entity';
import { Deal } from './deal.entity';
import { Lead } from './lead.entity';
import { Notification } from './notification.entity';
import { SalesPerson } from './sales-person.entity';
import { TimelineEvent } from './timeline-event.entity';
import { WebhookEvent } from './webhook-event.entity';

export const ENTITIES = [
  WebhookEvent,
  Lead,
  Deal,
  Configuration,
  TimelineEvent,
  Notification,
  Campaign,
  ConversionEvent,
  DeadLetterJob,
  SalesPerson,
];

export {
  Campaign,
  Configuration,
  ConversionEvent,
  DeadLetterJob,
  Deal,
  Lead,
  Notification,
  SalesPerson,
  TimelineEvent,
  WebhookEvent,
};
