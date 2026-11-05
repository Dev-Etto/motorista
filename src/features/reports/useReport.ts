import { useMemo } from 'react';
import { expenseRepository } from '@/data/repositories/expenseRepository';
import { shiftRepository, ShiftListItem } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { computeMonthClose, computeShift } from '@/domain/shift/shift';
import { summarizeShifts, totalsByPlatform, withLooseExpenses } from '@/domain/shift/summary';
import { loadInsights } from '@/features/insights/loadInsights';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { BarDatum } from '@/shared/ui/BarChart';
import { datesInRange, today } from '@/shared/utils/dates';
import { periodBounds, ReportPeriod } from './reportPeriod';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function buildChart(period: ReportPeriod, start: string, end: string, shifts: ShiftListItem[]): BarDatum[] {
  const totals = new Map<string, number>();
  const keyOf = (date: string) => (period === 'year' ? date.slice(5, 7) : date);
  for (const shift of shifts) {
    const key = keyOf(shift.date);
    totals.set(key, (totals.get(key) ?? 0) + computeShift(shift).profitCents);
  }

  if (period === 'year') return MONTH_LABELS.map((label, index) => ({ label, value: totals.get(String(index + 1).padStart(2, '0')) ?? 0 }));
  return datesInRange(start, end).map((date) => ({ label: date.slice(8, 10), value: totals.get(date) ?? 0 }));
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
  const currentVariablePerKm = costs.costs?.variablePerKm ?? 0;
  const monthClose =
    period === 'month' && costs.costs
      ? computeMonthClose({
          grossCents: summary.grossCents,
          km: summary.km,
          expensesCents: summary.expensesCents,
          variableCents: shifts.reduce((total, shift) => total + (shift.km ?? 0) * (shift.variablePerKm || currentVariablePerKm), 0),
          fixedMonthlyCents: costs.costs.fixedMonthly,
        })
      : null;

  return { period, start, end, shifts, summary, platforms: totalsByPlatform(shifts), monthClose, insights };
}

export type ReportData = Awaited<ReturnType<typeof loadReport>>;

export function useReport(period: ReportPeriod, date: string) {
  const report = useAsyncData(() => loadReport(period, date), [period, date]);
  const chart = useMemo(() => {
    if (!report.data) return [];
    return buildChart(report.data.period, report.data.start, report.data.end, report.data.shifts);
  }, [report.data]);
  return { ...report, chart };
}
