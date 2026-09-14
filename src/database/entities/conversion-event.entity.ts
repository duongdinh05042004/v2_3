import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Deal } from './deal.entity';
import { Lead } from './lead.entity';

@Entity('conversion_events')
export class ConversionEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'lead_id', type: 'uuid', nullable: true })
  leadId!: string | null;

  @ManyToOne(() => Lead, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'lead_id' })
  lead!: Lead | null;

  @Column({ name: 'deal_id', type: 'uuid', nullable: true })
  dealId!: string | null;

  @ManyToOne(() => Deal, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'deal_id' })
  deal!: Deal | null;

  @Column({ name: 'event_name', type: 'varchar', length: 100 })
  eventName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ttclid!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @Column({ name: 'sync_status', type: 'varchar', length: 50, default: 'pending' })
  syncStatus!: string;

  @Column({ name: 'synced_at', type: 'timestamptz', nullable: true })
  syncedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
