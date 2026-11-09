import { computeGoalProgress, requiredGrossForGoal } from '@domain/goal/goal';
import { accumulateGps } from '@domain/gps/gps';
import { buildInsights } from '@domain/insights/buildInsights';
import { ShiftFact } from '@domain/insights/types';
import { classifyOffer } from '@domain/offer/offer';
import { computeQuote } from '@domain/quote/quote';
import { computeMonthClose, computeShift } from '@domain/shift/shift';
import { computeCosts, suggestedProfile, CostProfile } from '@domain/vehicle/costs';
import { addDays, formatClock, monthBounds, weekBounds, workDaysLeft } from '@shared/utils/dates';
import { Money } from '@shared/utils/money';
import { parseDecimal } from '@shared/utils/numbers';

const BRL = { locale: 'pt-BR', currency: 'BRL' };
const formatBRL = (cents: number) => Money.fromCents(cents).format(BRL);
const parseBRL = (text: string) => Money.parse(text, BRL)?.wholeCents ?? null;

const profile = (over: Partial<CostProfile> = {}): CostProfile => ({
  ...suggestedProfile('car', 'owned'),
  fuelPriceCents: 600,
  consumptionKmPerUnit: 12,
  oilChangeCents: 30000,
  oilIntervalKm: 10000,
  tiresCents: 200000,
  tiresLifeKm: 50000,
  maintenanceMonthlyCents: 40000,
  insuranceMonthlyCents: 20000,
  ipvaYearlyCents: 120000,
  licensingYearlyCents: 12000,
  paymentMonthlyCents: 0,
  vehicleValueCents: 6000000,
  depreciationAnnualPct: 10,
  depreciationEnabled: true,
  otherFixedMonthlyCents: 0,
  plannedKmMonth: 4000,
  ...over,
});

describe('money', () => {
  it('formata em reais', () => {
    expect(formatBRL(123456)).toBe('R$ 1.234,56');
    expect(formatBRL(-5)).toBe('-R$ 0,05');
    expect(formatBRL(0)).toBe('R$ 0,00');
  });

  it('interpreta valores digitados', () => {
    expect(parseBRL('1.234,50')).toBe(123450);
    expect(parseBRL('12,5')).toBe(1250);
    expect(parseBRL('12.5')).toBe(1250);
    expect(parseBRL('1.234')).toBe(123400);
    expect(parseBRL('abc')).toBeNull();
    expect(parseBRL('')).toBeNull();
    expect(parseDecimal('11,5', 'pt-BR')).toBe(11.5);
  });
});

describe('custo por km', () => {
  it('soma variáveis e fixos', () => {
    const c = computeCosts(profile());
    expect(c.fuelPerKm).toBeCloseTo(50);
    expect(c.oilPerKm).toBeCloseTo(3);
    expect(c.tiresPerKm).toBeCloseTo(4);
    expect(c.maintenancePerKm).toBeCloseTo(10);
    expect(c.variablePerKm).toBeCloseTo(67);
    expect(c.taxesMonthly).toBeCloseTo(11000);
    expect(c.depreciationMonthly).toBeCloseTo(50000);
    expect(c.fixedMonthly).toBeCloseTo(81000);
    expect(c.fixedPerKm).toBeCloseTo(20.25);
    expect(c.fullPerKm).toBeCloseTo(87.25);
  });

  it('a sugestão segue o combustível', () => {
    expect(suggestedProfile('car', 'owned')).toMatchObject({ fuelPriceCents: 600, consumptionKmPerUnit: 11 });
    expect(suggestedProfile('car', 'owned', 'ethanol')).toMatchObject({ fuelPriceCents: 420, consumptionKmPerUnit: 8 });
    expect(suggestedProfile('car', 'owned', 'electric')).toMatchObject({ fuelPriceCents: 95, consumptionKmPerUnit: 6.5 });
    expect(suggestedProfile('motorcycle', 'owned', 'electric')).toMatchObject({ fuelPriceCents: 95, consumptionKmPerUnit: 25 });
    expect(suggestedProfile('car', 'owned', 'cng')).toMatchObject({ fuelPriceCents: 480, consumptionKmPerUnit: 13 });
  });

  it('a moto tem custos próprios de uso pesado', () => {
    const c = computeCosts(suggestedProfile('motorcycle', 'owned'));
    expect(c.fuelPerKm).toBeCloseTo(600 / 35);
    expect(c.oilPerKm).toBeCloseTo(3);
    expect(c.tiresPerKm).toBeCloseTo(6);
    expect(c.maintenancePerKm).toBeCloseTo(3);
    expect(c.variablePerKm).toBeCloseTo(29.14, 1);
    expect(c.variablePerKm).toBeLessThan(computeCosts(suggestedProfile('car', 'owned')).variablePerKm / 2);
  });

  it('financiado soma parcela, sem depreciação por padrão', () => {
    const base = suggestedProfile('car', 'financed');
    expect(base.depreciationEnabled).toBe(false);
    const c = computeCosts({ ...base, paymentMonthlyCents: 100000, vehicleValueCents: 6000000 });
    expect(c.paymentMonthly).toBe(100000);
    expect(c.depreciationMonthly).toBe(0);
  });

  it('alugado nunca deprecia', () => {
    const c = computeCosts(profile({ ownership: 'rented', paymentMonthlyCents: 200000, depreciationEnabled: true }));
    expect(c.depreciationMonthly).toBe(0);
    expect(c.paymentMonthly).toBe(200000);
  });

  it('quitado ignora parcela esquecida', () => {
    expect(computeCosts(profile({ paymentMonthlyCents: 99900 })).paymentMonthly).toBe(0);
  });

  it('não quebra com divisores zerados', () => {
    const c = computeCosts(profile({ consumptionKmPerUnit: 0, oilIntervalKm: 0, tiresLifeKm: 0, plannedKmMonth: 0 }));
    expect(c.fullPerKm).toBe(0);
  });
});

describe('jornada', () => {
  it('calcula lucro e taxas', () => {
    const r = computeShift({ grossCents: 30000, km: 150, minutes: 480, expensesCents: 2000, costPerKm: 100 });
    expect(r.vehicleCostCents).toBe(15000);
    expect(r.profitCents).toBe(13000);
    expect(r.grossPerKm).toBe(200);
    expect(r.grossPerHour).toBe(3750);
    expect(r.profitPerHour).toBe(1625);
    expect(r.partial).toBe(false);
  });

  it('sem km fica parcial e não inventa custo', () => {
    const r = computeShift({ grossCents: 30000, km: null, minutes: 0, expensesCents: 0, costPerKm: 100 });
    expect(r.partial).toBe(true);
    expect(r.profitCents).toBe(30000);
    expect(r.grossPerKm).toBeNull();
    expect(r.grossPerHour).toBeNull();
  });

  it('mês fechado desconta o fixo inteiro', () => {
    const m = computeMonthClose({ grossCents: 500000, km: 2000, expensesCents: 10000, variableCents: 120000, fixedMonthlyCents: 100000 });
    expect(m.profitCents).toBe(270000);
    expect(m.realCostPerKm).toBe(110);
  });
});

describe('viagem particular', () => {
  const quote = {
    kmToPassenger: 6,
    kmTrip: 20,
    kmReturn: 10,
    minutes: 50,
    costPerKm: 110,
    desiredProfitPerHourCents: 3000,
    tollCents: 1000,
    extrasCents: 0,
    minimumCents: 0,
  };

  it('reproduz o exemplo do plano', () => {
    const q = computeQuote(quote);
    expect(q.totalKm).toBe(36);
    expect(q.vehicleCostCents).toBeCloseTo(3960);
    expect(q.timeCents).toBeCloseTo(2500);
    expect(q.rawPriceCents).toBeCloseTo(7460);
    expect(q.priceCents).toBe(7500);
  });

  it('respeita o valor mínimo', () => {
    expect(computeQuote({ ...quote, minimumCents: 10000 }).priceCents).toBe(10000);
  });

  it('arredonda para cima, para o preço nunca ficar abaixo do custo', () => {
    const q = computeQuote({ ...quote, kmToPassenger: 0, kmTrip: 40, kmReturn: 0, costPerKm: 80.9, minutes: 0, tollCents: 0, extrasCents: 0, minimumCents: 0 });
    expect(q.vehicleCostCents).toBeCloseTo(3236);
    expect(q.priceCents).toBe(3300);
    expect(q.estimatedProfitCents).toBeGreaterThan(0);
  });
});

describe('oferta', () => {
  const base = { costPerKm: 100, targetPerKmCents: 200, targetPerHourCents: 3000 };

  it('verde quando atinge as duas metas', () => {
    expect(classifyOffer({ ...base, valueCents: 2000, km: 10, minutes: 20 }).color).toBe('green');
  });

  it('amarelo quando cobre o custo mas falha uma meta', () => {
    expect(classifyOffer({ ...base, valueCents: 1500, km: 10, minutes: 20 }).color).toBe('yellow');
    expect(classifyOffer({ ...base, valueCents: 2000, km: 10, minutes: 60 }).color).toBe('yellow');
  });

  it('vermelho quando não cobre o custo', () => {
    const r = classifyOffer({ ...base, valueCents: 900, km: 10, minutes: 20 });
    expect(r.color).toBe('red');
    expect(r.profitCents).toBe(-100);
  });
});

describe('meta do mês', () => {
  const goal = {
    desiredProfitCents: 300000,
    profitSoFarCents: 100000,
    profitTodayCents: 0,
    expensesTodayCents: 0,
    todayIsWorkDay: true,
    workDaysLeft: 10,
    dayOverrideCents: null,
    costPerKm: 75,
    plannedKmPerDay: 160,
  };

  it('o plano soma lucro desejado, fixos e custo dos km previstos', () => {
    expect(requiredGrossForGoal({ desiredProfitCents: 300000, fixedMonthlyCents: 100000, plannedKm: 4000, variablePerKm: 50 })).toBe(600000);
  });

  it('mede o progresso pelo lucro, não pelo faturamento', () => {
    const result = computeGoalProgress({ ...goal, profitSoFarCents: 200000 });
    expect(result.progress).toBeCloseTo(2 / 3);
    expect(result.remainingCents).toBe(100000);
    expect(result.reached).toBe(false);
  });

  it('divide o que falta pelos dias restantes', () => {
    expect(computeGoalProgress(goal).dailyTargetCents).toBe(20000);
  });

  it('a meta do dia não muda enquanto ele lucra', () => {
    const later = computeGoalProgress({ ...goal, profitSoFarCents: 115000, profitTodayCents: 15000 });
    expect(later.dailyTargetCents).toBe(20000);
    expect(later.leftTodayCents).toBe(5000);
  });

  it('meta do dia batida não fica negativa', () => {
    expect(computeGoalProgress({ ...goal, profitSoFarCents: 130000, profitTodayCents: 30000 }).leftTodayCents).toBe(0);
  });

  it('o faturamento do dia soma o custo dos km previstos', () => {
    expect(computeGoalProgress(goal).grossForDayCents).toBe(20000 + 160 * 75);
  });

  it('o faturamento do dia também cobre as despesas de hoje', () => {
    const result = computeGoalProgress({ ...goal, profitSoFarCents: 80000, profitTodayCents: -20000, expensesTodayCents: 20000 });
    expect(result.dailyTargetCents).toBe(20000);
    expect(result.grossForDayCents).toBe(20000 + 160 * 75 + 20000);
  });

  it('na folga, divide só o que falta agora e ignora as despesas de hoje', () => {
    const result = computeGoalProgress({ ...goal, todayIsWorkDay: false, profitSoFarCents: 115000, profitTodayCents: 15000, expensesTodayCents: 5000 });
    expect(result.dailyTargetCents).toBe(18500);
    expect(result.grossForDayCents).toBe(18500 + 160 * 75);
  });

  it('sem custo, não estima o faturamento', () => {
    expect(computeGoalProgress({ ...goal, costPerKm: null }).grossForDayCents).toBeNull();
  });

  it('respeita a meta de hoje ajustada', () => {
    const result = computeGoalProgress({ ...goal, dayOverrideCents: 5000, profitTodayCents: 2000 });
    expect(result.dailyTargetCents).toBe(5000);
    expect(result.leftTodayCents).toBe(3000);
  });

  it('meta batida mostra o que passou', () => {
    const result = computeGoalProgress({ ...goal, profitSoFarCents: 350000 });
    expect(result).toMatchObject({ reached: true, surplusCents: 50000, remainingCents: 0, progress: 1 });
  });

  it('prejuízo não deixa a barra negativa e aumenta o que falta', () => {
    const result = computeGoalProgress({ ...goal, profitSoFarCents: -50000 });
    expect(result.progress).toBe(0);
    expect(result.remainingCents).toBe(350000);
  });

  it('sem dias restantes, não há meta para hoje', () => {
    const result = computeGoalProgress({ ...goal, workDaysLeft: 0 });
    expect(result.dailyTargetCents).toBeNull();
    expect(result.leftTodayCents).toBeNull();
  });
});

describe('gps', () => {
  const p = (lat: number, lng: number, time: number, accuracy: number | null = 5) => ({ lat, lng, time, accuracy });

  it('soma trechos válidos', () => {
    const first = accumulateGps(null, p(-23.55, -46.63, 0));
    const next = accumulateGps(first.last, p(-23.551, -46.63, 30000));
    expect(next.meters).toBeGreaterThan(100);
    expect(next.meters).toBeLessThan(120);
  });

  it('ignora leitura imprecisa, tremor parado e salto impossível', () => {
    const first = accumulateGps(null, p(-23.55, -46.63, 0)).last;
    expect(accumulateGps(first, p(-23.56, -46.63, 30000, 200)).meters).toBe(0);
    expect(accumulateGps(first, p(-23.55001, -46.63, 30000)).meters).toBe(0);
    expect(accumulateGps(first, p(-22.0, -46.63, 30000)).meters).toBe(0);
  });
});

describe('datas', () => {
  it('cronômetro mostra segundos', () => {
    expect(formatClock(7000)).toBe('00:00:07');
    expect(formatClock(3723000)).toBe('01:02:03');
    expect(formatClock(-5)).toBe('00:00:00');
  });

  it('limites de mês e semana', () => {
    expect(monthBounds('2026-02-10')).toEqual({ start: '2026-02-01', end: '2026-02-28', days: 28 });
    expect(weekBounds('2026-11-04', 1)).toEqual({ start: '2026-11-02', end: '2026-11-08' });
    expect(weekBounds('2026-11-08', 1).start).toBe('2026-11-02');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('conta dias de trabalho restantes, incluindo hoje', () => {
    expect(workDaysLeft('2026-11-27', [1, 2, 3, 4, 5])).toBe(2);
  });
});

describe('insights', () => {
  const costs = computeCosts(profile());
  const shift = (date: string, over: Partial<ShiftFact> = {}): ShiftFact => ({
    date,
    startHour: 8,
    minutes: 480,
    km: 150,
    grossCents: 30000,
    expensesCents: 0,
    costPerKm: 100,
    earnings: [{ platform: 'A', cents: 30000 }],
    ...over,
  });
  const ctx = { today: '2026-11-20', costs, plannedKmMonth: 4000, fuelPaidCents: 0, fuelKm: 0 };

  it('não mostra nada sem dados suficientes', () => {
    expect(buildInsights({ ...ctx, shifts: [shift('2026-11-20')] })).toEqual([]);
  });

  it('calcula o lucro real', () => {
    const shifts = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20'].map((d) => shift(d));
    const real = buildInsights({ ...ctx, shifts }).find((i) => i.id === 'real-profit');
    expect(real).toMatchObject({ sharePerHundred: 50, shifts: 5 });
  });

  it('compara combustível previsto e pago', () => {
    const shifts = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20'].map((d) => shift(d));
    const gap = buildInsights({ ...ctx, shifts, fuelKm: 1000, fuelPaidCents: 56000 }).find((i) => i.id === 'fuel-gap');
    expect(gap).toMatchObject({ gapPct: 12 });
  });
});
