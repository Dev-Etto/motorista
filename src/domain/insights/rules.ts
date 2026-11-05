import { addDays, dayPeriod, fromISODate, monthBounds, weekdayName } from '@/shared/utils/dates';
import { formatBRL, formatNumber } from '@/shared/utils/money';
import { InsightRule, ShiftFact } from './types';

const MIN_BUCKET_SHIFTS = 2;
const MIN_PERIOD_GAP_CENTS = 100;
const MIN_FUEL_GAP_PCT = 10;
const MIN_MONTH_SHIFTS = 3;
const EXTRA_KM_SCENARIO = 1000;
const MS_PER_DAY = 86400000;

const profitOf = (shift: ShiftFact) => shift.grossCents - (shift.km ?? 0) * shift.costPerKm - shift.expensesCents;

const sumBy = <T,>(items: T[], selector: (item: T) => number) => items.reduce((total, item) => total + selector(item), 0);

function rankByProfitPerHour(shifts: ShiftFact[], keyOf: (shift: ShiftFact) => string | null) {
  const buckets = new Map<string, { profit: number; minutes: number; count: number }>();

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
    .map(([key, bucket]) => ({ key, perHour: (bucket.profit / bucket.minutes) * 60, count: bucket.count }))
    .sort((a, b) => b.perHour - a.perHour);
}

export const realProfitRule: InsightRule = ({ shifts, looseExpenses = [] }) => {
  const gross = sumBy(shifts, (shift) => shift.grossCents);
  if (gross <= 0) return null;

  const profit = sumBy(shifts, profitOf) - sumBy(looseExpenses, (expense) => expense.cents);
  const shareOfHundred = Math.round((profit / gross) * 100);
  return {
    id: 'real-profit',
    title: 'Lucro real',
    message: profit >= 0 ? `De cada R$ 100 faturados, R$ ${shareOfHundred} ficaram com você.` : `Para cada R$ 100 faturados, faltaram R$ ${-shareOfHundred} para cobrir os custos.`,
    basis: `Faturamento ${formatBRL(gross)} e lucro ${formatBRL(profit)} em ${shifts.length} jornadas.`,
  };
};

export const bestWeekdayRule: InsightRule = ({ shifts, today }) => {
  const cutoff = addDays(today, -28);
  const recent = shifts.filter((shift) => shift.date >= cutoff);
  const ranked = rankByProfitPerHour(recent, (shift) => String(fromISODate(shift.date).getDay()));
  if (ranked.length < 2) return null;

  const [best] = ranked;
  return {
    id: 'best-weekday',
    title: 'Melhor dia',
    message: `${weekdayName(Number(best.key))} rendeu o maior lucro por hora nas últimas 4 semanas.`,
    basis: `${formatBRL(best.perHour)}/h em ${best.count} jornadas.`,
  };
};

export const bestPeriodRule: InsightRule = ({ shifts }) => {
  const ranked = rankByProfitPerHour(shifts, (shift) => (shift.startHour === null ? null : dayPeriod(shift.startHour)));
  if (ranked.length < 2) return null;

  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const gap = best.perHour - worst.perHour;
  if (gap < MIN_PERIOD_GAP_CENTS) return null;

  return {
    id: 'best-period',
    title: 'Melhor período',
    message: `Jornadas iniciadas de ${best.key} rendem ${formatBRL(gap)}/h a mais do que as de ${worst.key}.`,
    basis: `${best.key}: ${formatBRL(best.perHour)}/h. ${worst.key}: ${formatBRL(worst.perHour)}/h.`,
  };
};

export const platformRule: InsightRule = ({ shifts }) => {
  const totals = new Map<string, number>();
  for (const earning of shifts.flatMap((shift) => shift.earnings)) {
    totals.set(earning.platform, (totals.get(earning.platform) ?? 0) + earning.cents);
  }
  if (totals.size < 2) return null;

  const gross = sumBy([...totals.values()], (cents) => cents);
  if (gross <= 0) return null;

  const [name, cents] = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    id: 'platform',
    title: 'Plataforma',
    message: `${name} trouxe ${Math.round((cents / gross) * 100)}% do seu faturamento.`,
    basis: `${formatBRL(cents)} de ${formatBRL(gross)}.`,
  };
};

export const biggestCostRule: InsightRule = ({ costs }) => {
  if (!costs || costs.fullPerKm <= 0) return null;

  const parts: [string, number][] = [
    ['Combustível', costs.fuelPerKm],
    ['Óleo', costs.oilPerKm],
    ['Pneus', costs.tiresPerKm],
    ['Manutenção', costs.maintenancePerKm],
    ['Custos fixos', costs.fixedPerKm],
  ];
  const [name, value] = parts.sort((a, b) => b[1] - a[1])[0];

  return {
    id: 'biggest-cost',
    title: 'Maior custo',
    message: `${name} é ${Math.round((value / costs.fullPerKm) * 100)}% do seu custo por km.`,
    basis: `${formatBRL(value)}/km de ${formatBRL(costs.fullPerKm)}/km.`,
  };
};

export const efficiencyRule: InsightRule = ({ shifts, today }) => {
  const lastStart = addDays(today, -6);
  const previousStart = addDays(today, -13);
  const last = shifts.filter((shift) => shift.date >= lastStart && shift.date <= today);
  const previous = shifts.filter((shift) => shift.date >= previousStart && shift.date < lastStart);
  const lastMinutes = sumBy(last, (shift) => shift.minutes);
  const previousMinutes = sumBy(previous, (shift) => shift.minutes);
  if (last.length < 2 || previous.length < 2 || lastMinutes <= 0 || previousMinutes <= 0) return null;

  const lastProfit = sumBy(last, profitOf);
  const previousProfit = sumBy(previous, profitOf);
  const lastRate = (lastProfit / lastMinutes) * 60;
  const previousRate = (previousProfit / previousMinutes) * 60;
  if (lastProfit <= previousProfit || lastRate >= previousRate) return null;

  return {
    id: 'efficiency',
    title: 'Eficiência',
    message: 'Seu lucro subiu, mas o lucro por hora caiu: você trabalhou mais para chegar lá.',
    basis: `Por hora: ${formatBRL(previousRate)} para ${formatBRL(lastRate)} nos últimos 7 dias.`,
  };
};

export const breakEvenRule: InsightRule = ({ shifts, costs, today }) => {
  if (!costs) return null;

  const workedDays = new Set(shifts.map((shift) => shift.date)).size;
  const firstDate = shifts.map((shift) => shift.date).sort()[0];
  const elapsedMs = fromISODate(today).getTime() - fromISODate(firstDate).getTime();
  const spanDays = Math.max(1, Math.round(elapsedMs / MS_PER_DAY) + 1);
  const daysPerMonth = Math.max(1, Math.round((workedDays / spanDays) * monthBounds(today).days));
  const kmPerDay = sumBy(shifts, (shift) => shift.km ?? 0) / workedDays;
  const breakEven = costs.fixedMonthly / daysPerMonth + kmPerDay * costs.variablePerKm;

  return {
    id: 'break-even',
    title: 'Ponto de equilíbrio',
    message: `Você precisa faturar ${formatBRL(breakEven)} por dia só para cobrir os custos.`,
    basis: `${daysPerMonth} dias por mês e ${formatNumber(kmPerDay, 0)} km por dia, em média.`,
  };
};

export const projectionRule: InsightRule = ({ shifts, costs, today, looseExpenses = [] }) => {
  if (!costs) return null;

  const { start, days } = monthBounds(today);
  const month = shifts.filter((shift) => shift.date >= start && shift.date <= today);
  if (month.length < MIN_MONTH_SHIFTS) return null;

  const monthLoose = looseExpenses.filter((expense) => expense.date >= start && expense.date <= today);
  const profit = sumBy(month, profitOf) - sumBy(monthLoose, (expense) => expense.cents);
  const dayOfMonth = Number(today.slice(8, 10));

  return {
    id: 'projection',
    title: 'Projeção do mês',
    message: `Nesse ritmo, você fecha o mês com ${formatBRL((profit / dayOfMonth) * days)} de lucro.`,
    basis: `${formatBRL(profit)} em ${dayOfMonth} dias do mês.`,
  };
};

export const fuelGapRule: InsightRule = ({ costs, fuelKm, fuelPaidCents }) => {
  if (!costs || fuelKm <= 0 || fuelPaidCents <= 0 || costs.fuelPerKm <= 0) return null;

  const expected = fuelKm * costs.fuelPerKm;
  const gapPct = Math.round(((fuelPaidCents - expected) / expected) * 100);
  if (Math.abs(gapPct) < MIN_FUEL_GAP_PCT) return null;

  const direction = gapPct > 0 ? 'a mais' : 'a menos';
  return {
    id: 'fuel-gap',
    title: 'Combustível',
    message: `Você gastou ${Math.abs(gapPct)}% ${direction} do que o previsto. Vale revisar o consumo.`,
    basis: `Previsto ${formatBRL(expected)} e pago ${formatBRL(fuelPaidCents)}.`,
  };
};

export const fixedWeightRule: InsightRule = ({ costs, plannedKmMonth }) => {
  if (!costs || plannedKmMonth <= 0 || costs.fixedMonthly <= 0) return null;

  const saving = costs.fixedMonthly / plannedKmMonth - costs.fixedMonthly / (plannedKmMonth + EXTRA_KM_SCENARIO);

  return {
    id: 'fixed-weight',
    title: 'Peso do custo fixo',
    message: `Rodando ${formatNumber(EXTRA_KM_SCENARIO, 0)} km a mais por mês, seu custo cairia ${formatBRL(saving)}/km.`,
    basis: `Fixos de ${formatBRL(costs.fixedMonthly)}/mês em ${formatNumber(plannedKmMonth, 0)} km previstos.`,
  };
};
