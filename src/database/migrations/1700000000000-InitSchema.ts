import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE webhook_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(255) UNIQUE NOT NULL,
        source VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        headers JSONB,
        signature_valid BOOLEAN DEFAULT false,
        processed BOOLEAN DEFAULT false,
        processing_error TEXT,
        received_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type)`);
    await queryRunner.query(`CREATE INDEX idx_webhook_events_received_at ON webhook_events(received_at)`);

    await queryRunner.query(`
      CREATE TABLE leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id VARCHAR(255) UNIQUE NOT NULL,
        source VARCHAR(50) NOT NULL DEFAULT 'tiktok',
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        email_normalized VARCHAR(255),
        phone VARCHAR(50),
        phone_e164 VARCHAR(20),
        city VARCHAR(255),
        campaign_id VARCHAR(255),
        campaign_name VARCHAR(255),
        ad_id VARCHAR(255),
        ad_name VARCHAR(255),
        form_id VARCHAR(255),
        form_name VARCHAR(255),
        advertiser_id VARCHAR(255),
        ttclid VARCHAR(255),
        utm_source VARCHAR(255),
        utm_campaign VARCHAR(255),
        interests TEXT[] DEFAULT '{}',
        custom_questions JSONB,
        raw_data JSONB,
        bitrix24_id INTEGER,
        bitrix24_sync_status VARCHAR(50) DEFAULT 'pending',
        bitrix24_sync_error TEXT,
        status VARCHAR(50) DEFAULT 'new',
        quality_score INTEGER DEFAULT 0,
        engagement_type VARCHAR(50),
        assigned_to VARCHAR(255),
        duplicate_of UUID,
        is_duplicate BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_leads_email_normalized ON leads(email_normalized)`);
    await queryRunner.query(`CREATE INDEX idx_leads_phone_e164 ON leads(phone_e164)`);
    await queryRunner.query(`CREATE INDEX idx_leads_campaign_id ON leads(campaign_id)`);
    await queryRunner.query(`CREATE INDEX idx_leads_source ON leads(source)`);
    await queryRunner.query(`CREATE INDEX idx_leads_status ON leads(status)`);
    await queryRunner.query(`CREATE INDEX idx_leads_created_at ON leads(created_at)`);
    await queryRunner.query(`CREATE INDEX idx_leads_bitrix24_id ON leads(bitrix24_id)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_leads_email_phone_active
      ON leads(email_normalized, phone_e164)
      WHERE is_duplicate = false AND email_normalized IS NOT NULL AND phone_e164 IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        bitrix24_id INTEGER,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(12,2),
        currency VARCHAR(3) DEFAULT 'VND',
        pipeline_id VARCHAR(50),
        stage VARCHAR(50),
        probability INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'open',
        assigned_to VARCHAR(255),
        assigned_by_rule VARCHAR(255),
        bitrix24_sync_status VARCHAR(50) DEFAULT 'pending',
        closed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_deals_lead_id ON deals(lead_id)`);
    await queryRunner.query(`CREATE INDEX idx_deals_status ON deals(status)`);
    await queryRunner.query(`CREATE INDEX idx_deals_assigned_to ON deals(assigned_to)`);
    await queryRunner.query(`CREATE INDEX idx_deals_stage ON deals(stage)`);

    await queryRunner.query(`
      CREATE TABLE configurations (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE timeline_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_timeline_entity ON timeline_events(entity_type, entity_id)`);

    await queryRunner.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id VARCHAR(255) UNIQUE NOT NULL,
        campaign_name VARCHAR(255),
        advertiser_id VARCHAR(255),
        spend DECIMAL(12,2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'VND',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE conversion_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
        event_name VARCHAR(100) NOT NULL,
        ttclid VARCHAR(255),
        payload JSONB,
        sync_status VARCHAR(50) DEFAULT 'pending',
        synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE dead_letter_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        queue_name VARCHAR(100) NOT NULL,
        job_name VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        error TEXT,
        attempts INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE sales_persons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        bitrix24_user_id INTEGER,
        territories TEXT[] DEFAULT '{}',
        specialties TEXT[] DEFAULT '{}',
        max_open_deals INTEGER DEFAULT 50,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS sales_persons`);
    await queryRunner.query(`DROP TABLE IF EXISTS dead_letter_jobs`);
    await queryRunner.query(`DROP TABLE IF EXISTS conversion_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS campaigns`);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
    await queryRunner.query(`DROP TABLE IF EXISTS timeline_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS configurations`);
    await queryRunner.query(`DROP TABLE IF EXISTS deals`);
    await queryRunner.query(`DROP TABLE IF EXISTS leads`);
    await queryRunner.query(`DROP TABLE IF EXISTS webhook_events`);
  }
}
