import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'campaign_id', type: 'varchar', length: 255, unique: true })
  campaignId!: string;

  @Column({ name: 'campaign_name', type: 'varchar', length: 255, nullable: true })
  campaignName!: string | null;

  @Column({ name: 'advertiser_id', type: 'varchar', length: 255, nullable: true })
  advertiserId!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  spend!: string;

  @Column({ type: 'varchar', length: 3, default: 'VND' })
  currency!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
