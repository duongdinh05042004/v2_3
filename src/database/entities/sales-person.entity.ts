import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sales_persons')
export class SalesPerson {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'external_id', type: 'varchar', length: 255, unique: true })
  externalId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'manager_external_id', type: 'varchar', length: 255, nullable: true })
  managerExternalId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ name: 'bitrix24_user_id', type: 'int', nullable: true })
  bitrix24UserId!: number | null;

  @Column({ type: 'text', array: true, default: '{}' })
  territories!: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  specialties!: string[];

  @Column({ name: 'max_open_deals', type: 'int', default: 50 })
  maxOpenDeals!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
