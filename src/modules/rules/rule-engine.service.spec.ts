import { RuleEngineService } from './rule-engine.service';
import { defaultDealRules } from '../../database/seeds/seed-data';
import sample from '../../../mocks/sample-payloads/lead.generate.json';

describe('RuleEngineService', () => {
  const engine = new RuleEngineService();
  const context = {
    ...(sample as unknown as Record<string, unknown>),
    quality_score: 80,
    custom_questions: (sample as { custom_questions: unknown[] }).custom_questions,
  };

  it('matches the sample sale campaign rule', () => {
    expect(engine.evaluate(context, "campaign.campaign_name CONTAINS 'sale'")).toBe(true);
    expect(engine.evaluate(context, "campaign.campaign_name CONTAINS 'winter'")).toBe(false);
  });

  it('supports AND / OR / numeric / IN operators', () => {
    expect(engine.evaluate(context, "quality_score GREATER_THAN 70 AND lead_data.city EQUALS 'Hà Nội'")).toBe(
      true,
    );
    expect(engine.evaluate(context, "lead_data.city EQUALS 'Hue' OR lead_data.city EQUALS 'Hà Nội'")).toBe(
      true,
    );
    expect(engine.evaluate(context, "lead_data.city IN 'Hue, Hà Nội'")).toBe(true);
    expect(engine.evaluate(context, "lead_data.interests CONTAINS 'technology'")).toBe(true);
    expect(engine.evaluate(context, "quality_score LESS_THAN 10")).toBe(false);
    expect(engine.evaluate(context, "lead_data.city STARTS_WITH 'Hà'")).toBe(true);
    expect(engine.evaluate(context, "lead_data.city ENDS_WITH 'Nội'")).toBe(true);
    expect(engine.evaluate(context, "lead_data.city NOT_EQUALS 'Hue'")).toBe(true);
    expect(engine.evaluate(context, "campaign.campaign_name NOT_CONTAINS 'winter'")).toBe(true);
  });

  it('matches custom question path and evaluates all default rules', () => {
    expect(engine.evaluate(context, "custom_questions.Budget range CONTAINS 'triệu'")).toBe(true);
    const matched = engine.evaluateAll(context, defaultDealRules);
    expect(matched).toHaveLength(1);
    expect(matched[0].action).toBe('create_deal');
    expect(matched[0].probability).toBe(30);
  });

  it('returns null for unparsable clauses', () => {
    expect(engine.parseClause('just a sentence')).toBeNull();
    expect(engine.evaluate(context, 'just a sentence')).toBe(false);
  });
});
