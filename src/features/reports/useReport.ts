import { useMemo } from 'react';
import { loadInsights } from '@application/insights';
import { expenseRepository } from '@data/repositories/expenseRepository';
import { shiftRepository } from '@data/repositories/shiftRepository';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { buildChart, closedMonthVariableCents, proratedFixedMonthly, ReportPeriod } from '@domain/report/report';
import { computeMonthClose } from '@domain/shift/shift';
import { summarizeShifts, totalsByPlatform, withLooseExpenses } from '@domain/shift/summary';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { useFormat } from '@shared/i18n/format';
import { today } from '@shared/utils/dates';
import { periodBounds } from './reportPeriod';

async function fixedCostsByVehicle(shifts: { vehicleId: number | null }[], date: string, currentFixed: number) {
  const ids = [...new Set(shifts.map((shift) => shift.vehicleId).filter((id): id is number => id !== null))];
  const entries = await Promise.all(ids.map(async (id) => [id, (await vehicleRepository.getCostsAt(date, id)).costs?.fixedMonthly ?? 0] as const));
  const fixed = new Map<number, number>(entries);
  return (vehicleId: number | null) => (vehicleId === null ? currentFixed : (fixed.get(vehicleId) ?? currentFixed));
}

async function loadReport(period: ReportPeriod, date: string, firstWeekday: number) {
  const { start, end } = periodBounds(period, date, firstWeekday);
  const [shifts, loose, costs, insights] = await Promise.all([
    shiftRepository.listFacts(start, end),
    expenseRepository.totalLooseCountable(start, end),
    vehicleRepository.getCostsAt(date),
    loadInsights(today()),
  ]);
  const summary = withLooseExpenses(summarizeShifts(shifts), loose);
  const fixedOf = await fixedCostsByVehicle(shifts, date, costs.costs?.fixedMonthly ?? 0);
  const currentVariablePerKm = costs.costs?.variablePerKm ?? 0;
  const monthClose =
    period === 'month' && costs.costs
      ? computeMonthClose({
          grossCents: summary.grossCents,
          km: summary.km,
          expensesCents: summary.expensesCents,
          variableCents: closedMonthVariableCents(shifts, currentVariablePerKm),
          fixedMonthlyCents: proratedFixedMonthly(shifts, fixedOf),
        })
      : null;

  return { period, start, end, shifts, summary, platforms: totalsByPlatform(shifts), monthClose, insights };
}

export type ReportData = Awaited<ReturnType<typeof loadReport>>;

export function useReport(period: ReportPeriod, date: string) {
  const format = useFormat();
  const { firstWeekday } = format.profile;
  const report = useAsyncData(() => loadReport(period, date, firstWeekday), [period, date, firstWeekday]);
  const chart = useMemo(() => {
    if (!report.data) return [];
    const label = report.data.period === 'year' ? format.monthShort : format.dayOfMonth;
    return buildChart(report.data.period, report.data.start, report.data.end, report.data.shifts).map((point) => ({
      label: label(point.date),
      value: point.value,
    }));
  }, [report.data, format]);
  return { ...report, chart };
}
