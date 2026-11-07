import { ShiftFact } from '@domain/insights/types';
import { computeShift } from '@domain/shift/shift';
import { addMonths, datesInRange } from '@shared/utils/dates';

export type ReportPeriod = 'week' | 'month' | 'year';

export interface ChartPoint {
  date: string;
  value: number;
}

const MONTHS_IN_YEAR = 12;
const MONTH_KEY = { start: 0, end: 7 };

export function closedMonthVariableCents(shifts: ShiftFact[], currentVariablePerKm: number): number {
  return shifts.reduce((total, shift) => total + (shift.km ?? 0) * (shift.variablePerKm || currentVariablePerKm), 0);
}

export function buildChart(period: ReportPeriod, start: string, end: string, shifts: ShiftFact[]): ChartPoint[] {
  const keyOf = (date: string) => (period === 'year' ? date.slice(MONTH_KEY.start, MONTH_KEY.end) : date);
  const totals = new Map<string, number>();
  for (const shift of shifts) {
    const key = keyOf(shift.date);
    totals.set(key, (totals.get(key) ?? 0) + computeShift(shift).profitCents);
  }

  if (period === 'year') {
    return Array.from({ length: MONTHS_IN_YEAR }, (_, index) => addMonths(start, index)).map((date) => ({ date, value: totals.get(keyOf(date)) ?? 0 }));
  }
  return datesInRange(start, end).map((date) => ({ date, value: totals.get(date) ?? 0 }));
}
