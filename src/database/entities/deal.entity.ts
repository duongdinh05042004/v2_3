import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lead } from './lead.entity';

@Entity('deals')
@Index(['status'])
@Index(['assignedTo'])
@Index(['stage'])
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'lead_id', type: 'uuid' })
  leadId!: string;

  @ManyToOne(() => Lead, (lead) => lead.deals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead!: Lead;

  @Column({ name: 'bitrix24_id', type: 'int', nullable: true })
  bitrix24Id!: number | null;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount!: string | null;

  @Column({ type: 'varchar', length: 3, default: 'VND' })
  currency!: string;

  @Column({ name: 'pipeline_id', type: 'varchar', length: 50, nullable: true })
  pipelineId!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  stage!: string | null;

  @Column({ type: 'int', default: 0 })
  probability!: number;

  @Column({ type: 'varchar', length: 50, default: 'open' })
  status!: string;

  @Column({ name: 'assigned_to', type: 'varchar', length: 255, nullable: true })
  assignedTo!: string | null;

  @Index('idx_deals_manager')
  @Column({ name: 'manager_external_id', type: 'varchar', length: 255, nullable: true })
  managerExternalId!: string | null;

  @Index('idx_deals_approval_status')
  @Column({ name: 'approval_status', type: 'varchar', length: 50, default: 'draft' })
  approvalStatus!: string;

  @Column({ name: 'submitted_by', type: 'varchar', length: 255, nullable: true })
  submittedBy!: string | null;

  @Column({ name: 'approved_by', type: 'varchar', length: 255, nullable: true })
  approvedBy!: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'assigned_by_rule', type: 'varchar', length: 255, nullable: true })
  assignedByRule!: string | null;

  @Column({ name: 'bitrix24_sync_status', type: 'varchar', length: 50, default: 'pending' })
  bitrix24SyncStatus!: string;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
