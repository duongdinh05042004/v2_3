import { Injectable } from '@nestjs/common';
import { getByPath } from '../../common/utils/object-path.util';

export type DealRule = {
  id?: string;
  condition: string;
  action: string;
  pipeline_id?: string;
  stage_id?: string;
  probability?: number;
  assign_to?: string;
  enabled?: boolean;
};

export type RuleMatch = {
  rule: DealRule;
  matched: boolean;
};

const OPERATORS = [
  'CONTAINS',
  'NOT_CONTAINS',
  'EQUALS',
  'NOT_EQUALS',
  'STARTS_WITH',
  'ENDS_WITH',
  'GREATER_THAN',
  'LESS_THAN',
  'IN',
] as const;

export type Operator = (typeof OPERATORS)[number];

@Injectable()
export class RuleEngineService {
  evaluateAll(context: Record<string, unknown>, rules: DealRule[]): DealRule[] {
    return rules.filter((rule) => rule.enabled !== false && this.evaluate(context, rule.condition));
  }

  evaluate(context: Record<string, unknown>, expression: string): boolean {
    const groups = expression.split(/\s+AND\s+/i).map((part) => part.trim());
    return groups.every((group) => {
      const alternatives = group.split(/\s+OR\s+/i).map((part) => part.trim());
      return alternatives.some((clause) => this.evaluateClause(context, clause));
    });
  }

  parseClause(clause: string): { path: string; operator: Operator; expected: string } | null {
    const operator = OPERATORS.find((op) => new RegExp(`\\s${op}\\s`, 'i').test(clause));
    if (!operator) {
      return null;
    }
    const [path, rawExpected] = clause.split(new RegExp(`\\s${operator}\\s`, 'i'));
    if (!path || rawExpected === undefined) {
      return null;
    }
    return {
      path: path.trim(),
      operator,
      expected: this.unquote(rawExpected.trim()),
    };
  }

  private evaluateClause(context: Record<string, unknown>, clause: string): boolean {
    const parsed = this.parseClause(clause);
    if (!parsed) {
      return false;
    }
    const actual = this.resolve(context, parsed.path);
    return this.compare(actual, parsed.operator, parsed.expected);
  }

  private resolve(context: Record<string, unknown>, path: string): unknown {
    const direct = getByPath(context, path);
    if (direct !== undefined) {
      return direct;
    }
    if (path.startsWith('custom_questions.')) {
      const question = path.replace('custom_questions.', '');
      const questions = getByPath(context, 'custom_questions');
      if (Array.isArray(questions)) {
        const hit = questions.find(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            String((item as { question?: string }).question).toLowerCase() === question.toLowerCase(),
        ) as { answer?: string } | undefined;
        return hit?.answer;
      }
    }
    return undefined;
  }

  compare(actual: unknown, operator: Operator, expected: string): boolean {
    if (Array.isArray(actual)) {
      const joined = actual.map(String);
      if (operator === 'CONTAINS') {
        return joined.some((item) => item.toLowerCase().includes(expected.toLowerCase()));
      }
      if (operator === 'IN') {
        return expected
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .some((item) => joined.map((v) => v.toLowerCase()).includes(item));
      }
    }

    const left = actual === undefined || actual === null ? '' : String(actual);
    const leftLower = left.toLowerCase();
    const rightLower = expected.toLowerCase();

    switch (operator) {
      case 'CONTAINS':
        return leftLower.includes(rightLower);
      case 'NOT_CONTAINS':
        return !leftLower.includes(rightLower);
      case 'EQUALS':
        return leftLower === rightLower;
      case 'NOT_EQUALS':
        return leftLower !== rightLower;
      case 'STARTS_WITH':
        return leftLower.startsWith(rightLower);
      case 'ENDS_WITH':
        return leftLower.endsWith(rightLower);
      case 'GREATER_THAN':
        return Number(left) > Number(expected);
      case 'LESS_THAN':
        return Number(left) < Number(expected);
      case 'IN':
        return expected
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .includes(leftLower);
      default:
        return false;
    }
  }

  private unquote(value: string): string {
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      return value.slice(1, -1);
    }
    return value;
  }
}
