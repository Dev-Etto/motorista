import { buildCalendar } from '../calendar/calendar';
import { suggestOfferTargets } from '../goal/goal';
import { classifyOffer, activeTargets, DEFAULT_LOW_DEMAND_TARGETS, DEFAULT_OFFER_TARGETS } from '../offer/offer';
import { isTimerForgotten } from '../shift/forgotten';

describe('calendário', () => {
  const weeks = buildCalendar('2026-11-10', [
    { date: '2026-11-02', profitCents: 100 },
    { date: '2026-11-02', profitCents: 50 },
  ]);

  it('começa na segunda-feira e fecha semanas completas', () => {
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0][6]?.date).toBe('2026-11-01');
    expect(weeks[1][0]?.date).toBe('2026-11-02');
  });

  it('soma jornadas do mesmo dia e mantém dias vazios', () => {
    expect(weeks[1][0]?.profitCents).toBe(150);
    expect(weeks[1][1]?.profitCents).toBeNull();
  });

  it('inclui todos os dias do mês', () => {
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
  });
});

describe('modo de período fraco', () => {
  const settings = { mode: 'low' as const, normal: DEFAULT_OFFER_TARGETS, low: DEFAULT_LOW_DEMAND_TARGETS };

  it('usa as metas do modo ativo', () => {
    expect(activeTargets(settings)).toBe(DEFAULT_LOW_DEMAND_TARGETS);
  });

  it('abaixo do custo continua vermelho', () => {
    const result = classifyOffer({ valueCents: 900, km: 10, minutes: 20, costPerKm: 100, targetPerKmCents: 1, targetPerHourCents: 1 });
    expect(result.color).toBe('red');
  });
});

describe('jornada esquecida', () => {
  it('avisa só com cronômetro ligado há muito tempo', () => {
    const fourteenHours = 14 * 60 * 60 * 1000;
    expect(isTimerForgotten(true, fourteenHours)).toBe(true);
    expect(isTimerForgotten(true, fourteenHours - 1)).toBe(false);
    expect(isTimerForgotten(false, fourteenHours)).toBe(false);
  });
});

describe('metas sugeridas pela meta do mês', () => {
  it('transforma o faturamento necessário em mínimos por km e por hora', () => {
    const result = suggestOfferTargets({ requiredGrossCents: 600000, plannedKm: 4000, workDaysInMonth: 25, hoursPerDay: 8 });
    expect(result?.targetPerKmCents).toBe(150);
    expect(result?.targetPerHourCents).toBe(3000);
    expect(result?.grossPerWorkDayCents).toBe(24000);
  });

  it('arredonda para cima, para não ficar abaixo do necessário', () => {
    const result = suggestOfferTargets({ requiredGrossCents: 600100, plannedKm: 4000, workDaysInMonth: 25, hoursPerDay: 8 });
    expect(result?.targetPerKmCents).toBe(160);
  });

  it('sem km ou horas não sugere nada', () => {
    expect(suggestOfferTargets({ requiredGrossCents: 600000, plannedKm: 0, workDaysInMonth: 25, hoursPerDay: 8 })).toBeNull();
    expect(suggestOfferTargets({ requiredGrossCents: 600000, plannedKm: 4000, workDaysInMonth: 0, hoursPerDay: 8 })).toBeNull();
  });
});
