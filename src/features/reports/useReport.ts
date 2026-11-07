import { useMemo } from 'react';
import { loadInsights } from '@/application/insights';
import { expenseRepository } from '@/data/repositories/expenseRepository';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { buildChart, closedMonthVariableCents, ReportPeriod } from '@/domain/report/report';
import { computeMonthClose } from '@/domain/shift/shift';
import { summarizeShifts, totalsByPlatform, withLooseExpenses } from '@/domain/shift/summary';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { today } from '@/shared/utils/dates';
import { periodBounds } from './reportPeriod';

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
          variableCents: closedMonthVariableCents(shifts, currentVariablePerKm),
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
