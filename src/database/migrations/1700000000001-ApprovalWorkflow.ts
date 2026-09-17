import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApprovalWorkflow1700000000001 implements MigrationInterface {
  name = 'ApprovalWorkflow1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE sales_persons ADD COLUMN IF NOT EXISTS manager_external_id VARCHAR(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE deals ADD COLUMN IF NOT EXISTS manager_external_id VARCHAR(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE deals ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) NOT NULL DEFAULT 'draft'`,
    );
    await queryRunner.query(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(255)`);
    await queryRunner.query(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255)`);
    await queryRunner.query(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_deals_approval_status ON deals(approval_status)`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_persons_manager ON sales_persons(manager_external_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sales_persons_manager`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_deals_approval_status`);
    await queryRunner.query(`ALTER TABLE deals DROP COLUMN IF EXISTS approved_at`);
    await queryRunner.query(`ALTER TABLE deals DROP COLUMN IF EXISTS approved_by`);
    await queryRunner.query(`ALTER TABLE deals DROP COLUMN IF EXISTS submitted_by`);
    await queryRunner.query(`ALTER TABLE deals DROP COLUMN IF EXISTS approval_status`);
    await queryRunner.query(`ALTER TABLE deals DROP COLUMN IF EXISTS manager_external_id`);
    await queryRunner.query(`ALTER TABLE sales_persons DROP COLUMN IF EXISTS manager_external_id`);
  }
}
