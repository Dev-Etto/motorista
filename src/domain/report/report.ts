import { ShiftFact } from '@/domain/insights/types';
import { computeShift } from '@/domain/shift/shift';
import { datesInRange } from '@/shared/utils/dates';

export type ReportPeriod = 'week' | 'month' | 'year';

export interface ChartPoint {
  label: string;
  value: number;
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_KEY = { start: 5, end: 7 };
const DAY_KEY = { start: 8, end: 10 };

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

  if (period === 'year') return MONTH_LABELS.map((label, index) => ({ label, value: totals.get(String(index + 1).padStart(2, '0')) ?? 0 }));
  return datesInRange(start, end).map((date) => ({ label: date.slice(DAY_KEY.start, DAY_KEY.end), value: totals.get(date) ?? 0 }));
}
