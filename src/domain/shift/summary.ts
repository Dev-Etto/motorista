import { ShiftFact } from '@/domain/insights/types';
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
        partialCount: acc.partialCount + (result.partial ? 1 : 0),
        minutes: acc.minutes + shift.minutes,
      };
    },
    { count: 0, grossCents: 0, vehicleCostCents: 0, expensesCents: 0, profitCents: 0, km: 0, minutes: 0, grossWithKm: 0, partialCount: 0 },
  );

  const { grossWithKm, ...summary } = totals;

  return {
    ...summary,
    grossPerKm: totals.km > 0 ? grossWithKm / totals.km : null,
    grossPerHour: totals.minutes > 0 ? (totals.grossCents / totals.minutes) * 60 : null,
    profitPerHour: totals.minutes > 0 ? (totals.profitCents / totals.minutes) * 60 : null,
  };
}

export function withLooseExpenses(summary: ShiftSummary, looseExpensesCents: number): ShiftSummary {
  const profitCents = summary.profitCents - looseExpensesCents;

  return {
    ...summary,
    profitCents,
    expensesCents: summary.expensesCents + looseExpensesCents,
    profitPerHour: summary.minutes > 0 ? (profitCents / summary.minutes) * 60 : null,
  };
}

export function totalsByPlatform(shifts: ShiftFact[]): { platform: string; cents: number }[] {
  const totals = new Map<string, number>();
  for (const earning of shifts.flatMap((shift) => shift.earnings)) {
    totals.set(earning.platform, (totals.get(earning.platform) ?? 0) + earning.cents);
  }
  return [...totals.entries()].map(([platform, cents]) => ({ platform, cents })).sort((a, b) => b.cents - a.cents);
}
