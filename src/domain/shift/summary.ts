import { ShiftFact } from '@domain/insights/types';
import { MINUTES_PER_HOUR } from '@shared/utils/time';
import { computeShift } from './shift';

export interface ShiftSummary {
  count: number;
  grossCents: number;
  vehicleCostCents: number;
  expensesCents: number;
  profitCents: number;
  km: number;
  minutes: number;
  partialCount: number;
  grossPerKm: number | null;
  grossPerHour: number | null;
  profitPerHour: number | null;
}

export function summarizeShifts(shifts: ShiftFact[]): ShiftSummary {
  const totals = shifts.reduce(
    (acc, shift) => {
      const result = computeShift(shift);
      return {
        count: acc.count + 1,
        grossCents: acc.grossCents + result.grossCents,
        vehicleCostCents: acc.vehicleCostCents + result.vehicleCostCents,
        expensesCents: acc.expensesCents + result.expensesCents,
        profitCents: acc.profitCents + result.profitCents,
        km: acc.km + (shift.km ?? 0),
        grossWithKm: acc.grossWithKm + (shift.km ? result.grossCents : 0),
        grossWithMinutes: acc.grossWithMinutes + (shift.minutes > 0 ? result.grossCents : 0),
        profitWithMinutes: acc.profitWithMinutes + (shift.minutes > 0 ? result.profitCents : 0),
        partialCount: acc.partialCount + (result.partial ? 1 : 0),
        minutes: acc.minutes + shift.minutes,
      };
    },
    {
      count: 0,
      grossCents: 0,
      vehicleCostCents: 0,
      expensesCents: 0,
      profitCents: 0,
      km: 0,
      minutes: 0,
      grossWithKm: 0,
      grossWithMinutes: 0,
      profitWithMinutes: 0,
      partialCount: 0,
    },
  );

  const { grossWithKm, grossWithMinutes, profitWithMinutes, ...summary } = totals;

  return {
    ...summary,
    grossPerKm: totals.km > 0 ? grossWithKm / totals.km : null,
    grossPerHour: totals.minutes > 0 ? (grossWithMinutes / totals.minutes) * MINUTES_PER_HOUR : null,
    profitPerHour: totals.minutes > 0 ? (profitWithMinutes / totals.minutes) * MINUTES_PER_HOUR : null,
  };
}

export function withLooseExpenses(summary: ShiftSummary, looseExpensesCents: number): ShiftSummary {
  const profitCents = summary.profitCents - looseExpensesCents;

  return {
    ...summary,
    profitCents,
    expensesCents: summary.expensesCents + looseExpensesCents,
    profitPerHour: summary.profitPerHour === null ? null : summary.profitPerHour - (looseExpensesCents / summary.minutes) * MINUTES_PER_HOUR,
  };
}

export function totalsByPlatform(shifts: ShiftFact[]): { platform: string; cents: number }[] {
  const totals = new Map<string, number>();
  for (const earning of shifts.flatMap((shift) => shift.earnings)) {
    totals.set(earning.platform, (totals.get(earning.platform) ?? 0) + earning.cents);
  }
  return [...totals.entries()].map(([platform, cents]) => ({ platform, cents })).sort((a, b) => b.cents - a.cents);
}
