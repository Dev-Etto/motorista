import { ShiftFact } from '@domain/insights/types';
import { buildChart, closedMonthVariableCents } from '@domain/report/report';

const fact = (date: string, over: Partial<ShiftFact> = {}): ShiftFact => ({
  date,
  startHour: 8,
  minutes: 480,
  km: 100,
  grossCents: 30000,
  expensesCents: 0,
  costPerKm: 100,
  variablePerKm: 60,
  earnings: [],
  ...over,
});

describe('mês fechado', () => {
  it('usa o custo variável salvo em cada jornada', () => {
    expect(closedMonthVariableCents([fact('2026-11-01'), fact('2026-11-02', { km: 50, variablePerKm: 40 })], 99)).toBe(100 * 60 + 50 * 40);
  });

  it('usa o custo atual quando a jornada não guardou o variável', () => {
    expect(closedMonthVariableCents([fact('2026-11-01', { variablePerKm: 0 })], 70)).toBe(7000);
  });

  it('jornada sem km não tem custo variável', () => {
    expect(closedMonthVariableCents([fact('2026-11-01', { km: null })], 70)).toBe(0);
  });
});

describe('gráfico do relatório', () => {
  it('soma o lucro por dia no período', () => {
    const chart = buildChart('week', '2026-11-02', '2026-11-04', [fact('2026-11-02'), fact('2026-11-02'), fact('2026-11-04')]);
    expect(chart).toEqual([
      { date: '2026-11-02', value: 40000 },
      { date: '2026-11-03', value: 0 },
      { date: '2026-11-04', value: 20000 },
    ]);
  });

  it('soma o lucro por mês no ano', () => {
    const chart = buildChart('year', '2026-01-01', '2026-12-31', [fact('2026-03-10'), fact('2026-03-20')]);
    expect(chart).toHaveLength(12);
    expect(chart[2]).toEqual({ date: '2026-03-01', value: 40000 });
    expect(chart[0]).toEqual({ date: '2026-01-01', value: 0 });
  });
});
