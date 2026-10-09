import {
  bestPeriodRule,
  bestWeekdayRule,
  biggestCostRule,
  breakEvenRule,
  efficiencyRule,
  fixedWeightRule,
  fuelGapRule,
  platformRule,
  projectionRule,
  realProfitRule,
} from './rules';
import { Insight, InsightContext, InsightRule } from './types';

export const MIN_SHIFTS_FOR_INSIGHTS = 5;

const RULES: InsightRule[] = [
  realProfitRule,
  bestWeekdayRule,
  bestPeriodRule,
  platformRule,
  biggestCostRule,
  efficiencyRule,
  breakEvenRule,
  projectionRule,
  fuelGapRule,
  fixedWeightRule,
];

export function buildInsights(context: InsightContext): Insight[] {
  if (context.shifts.length < MIN_SHIFTS_FOR_INSIGHTS) return [];

  return RULES.map((rule) => rule(context)).filter((insight): insight is Insight => insight !== null);
}
