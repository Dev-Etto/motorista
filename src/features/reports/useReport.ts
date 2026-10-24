import { useMemo } from 'react';
import { expenseRepository } from '@/data/repositories/expenseRepository';
import { shiftRepository, ShiftListItem } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { computeMonthClose, computeShift } from '@/domain/shift/shift';
import { summarizeShifts, totalsByPlatform, withLooseExpenses } from '@/domain/shift/summary';
import { loadInsights } from '@/features/insights/loadInsights';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { BarDatum } from '@/shared/ui/BarChart';
import { monthBounds, today, weekBounds } from '@/shared/utils/dates';

export type ReportPeriod = 'week' | 'month' | 'year';

function periodBounds(period: ReportPeriod, date: string) {
  if (period === 'week') return weekBounds(date);
  if (period === 'month') return monthBounds(date);
  const year = date.slice(0, 4);
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function buildChart(period: ReportPeriod, shifts: ShiftListItem[]): BarDatum[] {
  const labelOf = (date: string) => (period === 'year' ? date.slice(5, 7) : date.slice(8, 10));
  const totals = new Map<string, number>();
  for (const shift of [...shifts].reverse()) {
    const label = labelOf(shift.date);
    totals.set(label, (totals.get(label) ?? 0) + computeShift(shift).profitCents);
  }
  return [...totals.entries()].map(([label, value]) => ({ label, value }));
}

async function loadReport(period: ReportPeriod, date: string) {
  const { start, end } = periodBounds(period, date);
  const [shifts, loose, costs, insights] = await Promise.all([
    shiftRepository.listFacts(start, end),
    expenseRepository.totalLooseCountable(start, end),
    vehicleRepository.getCostsAt(date),
    loadInsights(today()),
  ]);
  const summary = withLooseExpenses(summarizeShifts(shifts), loose);
  const monthClose =
    period === 'month' && costs.costs
      ? computeMonthClose({
          grossCents: summary.grossCents,
          km: summary.km,
          expensesCents: summary.expensesCents,
          variablePerKm: costs.costs.variablePerKm,
          fixedMonthlyCents: costs.costs.fixedMonthly,
        })
      : null;

  return { start, end, shifts, summary, platforms: totalsByPlatform(shifts), monthClose, insights };
}

export type ReportData = Awaited<ReturnType<typeof loadReport>>;

export function useReport(period: ReportPeriod, date: string) {
  const report = useAsyncData(() => loadReport(period, date), [period, date]);
  const chart = useMemo(() => buildChart(period, report.data?.shifts ?? []), [period, report.data?.shifts]);
  return { ...report, chart };
}
