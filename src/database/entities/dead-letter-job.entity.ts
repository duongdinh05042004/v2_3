import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('dead_letter_jobs')
export class DeadLetterJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'queue_name', type: 'varchar', length: 100 })
  queueName!: string;

  @Column({ name: 'job_name', type: 'varchar', length: 100 })
  jobName!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
