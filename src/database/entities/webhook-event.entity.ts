import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('webhook_events')
@Index(['eventType'])
@Index(['receivedAt'])
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_id', type: 'varchar', length: 255, unique: true })
  eventId!: string;

  @Column({ type: 'varchar', length: 50 })
  source!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  headers!: Record<string, unknown> | null;

  @Column({ name: 'signature_valid', type: 'boolean', default: false })
  signatureValid!: boolean;

  @Column({ type: 'boolean', default: false })
  processed!: boolean;

  @Column({ name: 'processing_error', type: 'text', nullable: true })
  processingError!: string | null;

  @CreateDateColumn({ name: 'received_at', type: 'timestamptz' })
  receivedAt!: Date;
}
