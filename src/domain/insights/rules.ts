import { computeShift } from '@domain/shift/shift';
import { totalsByPlatform } from '@domain/shift/summary';
import { addDays, type DayPeriod, dayPeriod, daysBetween, monthBounds, weekdayOf } from '@shared/utils/dates';
import { MINUTES_PER_HOUR } from '@shared/utils/time';
import type { CostPart, InsightRule, ShiftFact } from './types';

const MIN_BUCKET_SHIFTS = 2;
const MIN_PERIOD_GAP_CENTS = 100;
const MIN_FUEL_GAP_PCT = 10;
const MIN_MONTH_SHIFTS = 3;
const EXTRA_KM_SCENARIO = 1000;
const RECENT_DAYS = 28;

const profitOf = (shift: ShiftFact) => computeShift(shift).profitCents;

const sumBy = <T>(items: T[], selector: (item: T) => number) => items.reduce((total, item) => total + selector(item), 0);

function rankByProfitPerHour<K>(shifts: ShiftFact[], keyOf: (shift: ShiftFact) => K | null) {
  const buckets = new Map<K, { profit: number; minutes: number; count: number }>();

  for (const shift of shifts) {
    const key = keyOf(shift);
    if (key === null || shift.minutes <= 0) continue;

    const bucket = buckets.get(key) ?? { profit: 0, minutes: 0, count: 0 };
    buckets.set(key, {
      profit: bucket.profit + profitOf(shift),
      minutes: bucket.minutes + shift.minutes,
      count: bucket.count + 1,
    });
  }

  return [...buckets.entries()]
    .filter(([, bucket]) => bucket.count >= MIN_BUCKET_SHIFTS)
    .map(([key, bucket]) => ({ key, perHour: (bucket.profit / bucket.minutes) * MINUTES_PER_HOUR, count: bucket.count }))
    .sort((a, b) => b.perHour - a.perHour);
}

export const realProfitRule: InsightRule = ({ shifts, looseExpenses = [] }) => {
  const gross = sumBy(shifts, (shift) => shift.grossCents);
  if (gross <= 0) return null;

  const profit = sumBy(shifts, profitOf) - sumBy(looseExpenses, (expense) => expense.cents);
  const shareOfHundred = Math.round((profit / gross) * 100);
  return { id: 'real-profit', grossCents: gross, profitCents: profit, shifts: shifts.length, sharePerHundred: shareOfHundred };
};

export const bestWeekdayRule: InsightRule = ({ shifts, today }) => {
  const cutoff = addDays(today, -(RECENT_DAYS - 1));
  const recent = shifts.filter((shift) => shift.date >= cutoff && shift.date <= today);
  const ranked = rankByProfitPerHour(recent, (shift) => weekdayOf(shift.date));
  if (ranked.length < 2) return null;

  const [best] = ranked;
  if (!best) return null;

  return { id: 'best-weekday', weekday: best.key, perHourCents: best.perHour, shifts: best.count };
};

export const bestPeriodRule: InsightRule = ({ shifts }) => {
  const ranked = rankByProfitPerHour<DayPeriod>(shifts, (shift) => (shift.startHour === null ? null : dayPeriod(shift.startHour)));
  if (ranked.length < 2) return null;

  const best = ranked[0];
  const worst = ranked.at(-1);
  if (!best || !worst) return null;

  const gap = best.perHour - worst.perHour;
  if (gap < MIN_PERIOD_GAP_CENTS) return null;

  return { id: 'best-period', best: best.key, worst: worst.key, gapCents: gap, bestPerHourCents: best.perHour, worstPerHourCents: worst.perHour };
};

export const platformRule: InsightRule = ({ shifts }) => {
  const totals = totalsByPlatform(shifts);
  if (totals.length < 2) return null;

  const gross = sumBy(totals, (total) => total.cents);
  if (gross <= 0) return null;

  const [top] = totals;
  if (!top) return null;

  const { platform, cents } = top;
  return { id: 'platform', platform, sharePct: Math.round((cents / gross) * 100), cents, grossCents: gross };
};

export const biggestCostRule: InsightRule = ({ costs }) => {
  if (!costs || costs.fullPerKm <= 0) return null;

  const parts: [CostPart, number][] = [
    ['fuel', costs.fuelPerKm],
    ['oil', costs.oilPerKm],
    ['tires', costs.tiresPerKm],
    ['maintenance', costs.maintenancePerKm],
    ['fixed', costs.fixedPerKm],
  ];
  const [biggest] = parts.sort((a, b) => b[1] - a[1]);
  if (!biggest) return null;

  const [part, value] = biggest;
  return { id: 'biggest-cost', part, sharePct: Math.round((value / costs.fullPerKm) * 100), perKmCents: value, fullPerKmCents: costs.fullPerKm };
};

export const efficiencyRule: InsightRule = ({ shifts, today }) => {
  const lastStart = addDays(today, -6);
  const previousStart = addDays(today, -13);
  const timed = shifts.filter((shift) => shift.minutes > 0);
  const last = timed.filter((shift) => shift.date >= lastStart && shift.date <= today);
  const previous = timed.filter((shift) => shift.date >= previousStart && shift.date < lastStart);
  const lastMinutes = sumBy(last, (shift) => shift.minutes);
  const previousMinutes = sumBy(previous, (shift) => shift.minutes);
  if (last.length < 2 || previous.length < 2 || lastMinutes <= 0 || previousMinutes <= 0) return null;

  const lastProfit = sumBy(last, profitOf);
  const previousProfit = sumBy(previous, profitOf);
  const lastRate = (lastProfit / lastMinutes) * MINUTES_PER_HOUR;
  const previousRate = (previousProfit / previousMinutes) * MINUTES_PER_HOUR;
  if (lastProfit <= previousProfit || lastRate >= previousRate) return null;

  return { id: 'efficiency', previousPerHourCents: previousRate, lastPerHourCents: lastRate };
};

export const breakEvenRule: InsightRule = ({ shifts, costs, today }) => {
  if (!costs) return null;

  const workedDays = new Set(shifts.map((shift) => shift.date)).size;
  const [firstDate] = shifts.map((shift) => shift.date).sort();
  if (!firstDate) return null;

  const spanDays = Math.max(1, daysBetween(firstDate, today) + 1);
  const daysPerMonth = Math.max(1, Math.round((workedDays / spanDays) * monthBounds(today).days));
  const kmPerDay = sumBy(shifts, (shift) => shift.km ?? 0) / workedDays;
  const breakEven = costs.fixedMonthly / daysPerMonth + kmPerDay * costs.variablePerKm;

  return { id: 'break-even', dailyCents: breakEven, daysPerMonth, kmPerDay };
};

export const projectionRule: InsightRule = ({ shifts, costs, today, looseExpenses = [] }) => {
  if (!costs) return null;

  const { start, days } = monthBounds(today);
  const month = shifts.filter((shift) => shift.date >= start && shift.date <= today);
  if (month.length < MIN_MONTH_SHIFTS) return null;

  const monthLoose = looseExpenses.filter((expense) => expense.date >= start && expense.date <= today);
  const profit = sumBy(month, profitOf) - sumBy(monthLoose, (expense) => expense.cents);
  const dayOfMonth = Number(today.slice(8, 10));

  return { id: 'projection', projectedCents: (profit / dayOfMonth) * days, profitCents: profit, dayOfMonth };
};

export const fuelGapRule: InsightRule = ({ costs, fuelKm, fuelPaidCents }) => {
  if (!costs || fuelKm <= 0 || fuelPaidCents <= 0 || costs.fuelPerKm <= 0) return null;

  const expected = fuelKm * costs.fuelPerKm;
  const gapPct = Math.round(((fuelPaidCents - expected) / expected) * 100);
  if (Math.abs(gapPct) < MIN_FUEL_GAP_PCT) return null;

  return { id: 'fuel-gap', gapPct, expectedCents: expected, paidCents: fuelPaidCents };
};

export const fixedWeightRule: InsightRule = ({ costs, plannedKmMonth }) => {
  if (!costs || plannedKmMonth <= 0 || costs.fixedMonthly <= 0) return null;

  const saving = costs.fixedMonthly / plannedKmMonth - costs.fixedMonthly / (plannedKmMonth + EXTRA_KM_SCENARIO);

  return { id: 'fixed-weight', extraKm: EXTRA_KM_SCENARIO, savingPerKmCents: saving, fixedMonthlyCents: costs.fixedMonthly, plannedKm: plannedKmMonth };
};
