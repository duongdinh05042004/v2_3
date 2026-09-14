import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Deal } from './deal.entity';

@Entity('leads')
@Index(['emailNormalized'])
@Index(['phoneE164'])
@Index(['campaignId'])
@Index(['source'])
@Index(['status'])
@Index(['createdAt'])
@Index(['bitrix24Id'])
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'external_id', type: 'varchar', length: 255, unique: true })
  externalId!: string;

  @Column({ type: 'varchar', length: 50, default: 'tiktok' })
  source!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ name: 'email_normalized', type: 'varchar', length: 255, nullable: true })
  emailNormalized!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ name: 'phone_e164', type: 'varchar', length: 20, nullable: true })
  phoneE164!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city!: string | null;

  @Column({ name: 'campaign_id', type: 'varchar', length: 255, nullable: true })
  campaignId!: string | null;

  @Column({ name: 'campaign_name', type: 'varchar', length: 255, nullable: true })
  campaignName!: string | null;

  @Column({ name: 'ad_id', type: 'varchar', length: 255, nullable: true })
  adId!: string | null;

  @Column({ name: 'ad_name', type: 'varchar', length: 255, nullable: true })
  adName!: string | null;

  @Column({ name: 'form_id', type: 'varchar', length: 255, nullable: true })
  formId!: string | null;

  @Column({ name: 'form_name', type: 'varchar', length: 255, nullable: true })
  formName!: string | null;

  @Column({ name: 'advertiser_id', type: 'varchar', length: 255, nullable: true })
  advertiserId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ttclid!: string | null;

  @Column({ name: 'utm_source', type: 'varchar', length: 255, nullable: true })
  utmSource!: string | null;

  @Column({ name: 'utm_campaign', type: 'varchar', length: 255, nullable: true })
  utmCampaign!: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  interests!: string[];

  @Column({ name: 'custom_questions', type: 'jsonb', nullable: true })
  customQuestions!: Array<{ question: string; answer: string }> | null;

  @Column({ name: 'raw_data', type: 'jsonb', nullable: true })
  rawData!: Record<string, unknown> | null;

  @Column({ name: 'bitrix24_id', type: 'int', nullable: true })
  bitrix24Id!: number | null;

  @Column({ name: 'bitrix24_sync_status', type: 'varchar', length: 50, default: 'pending' })
  bitrix24SyncStatus!: string;

  @Column({ name: 'bitrix24_sync_error', type: 'text', nullable: true })
  bitrix24SyncError!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'new' })
  status!: string;

  @Column({ name: 'quality_score', type: 'int', default: 0 })
  qualityScore!: number;

  @Column({ name: 'engagement_type', type: 'varchar', length: 50, nullable: true })
  engagementType!: string | null;

  @Column({ name: 'assigned_to', type: 'varchar', length: 255, nullable: true })
  assignedTo!: string | null;

  @Column({ name: 'duplicate_of', type: 'uuid', nullable: true })
  duplicateOf!: string | null;

  @Column({ name: 'is_duplicate', type: 'boolean', default: false })
  isDuplicate!: boolean;

  @OneToMany(() => Deal, (deal) => deal.lead)
  deals!: Deal[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
