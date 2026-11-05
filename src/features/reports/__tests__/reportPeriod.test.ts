import { periodBounds, periodLabel, stepPeriod } from '../reportPeriod';

const TODAY = '2026-11-05';

describe('período dos relatórios', () => {
  it('semana mostra a semana de hoje', () => {
    expect(periodBounds('week', TODAY)).toEqual({ start: '2026-11-02', end: '2026-11-08' });
    expect(periodLabel('week', TODAY)).toBe('02/11 a 08/11');
  });

  it('as setas andam uma semana na semana', () => {
    expect(periodLabel('week', stepPeriod('week', TODAY, -1))).toBe('26/10 a 01/11');
    expect(stepPeriod('week', stepPeriod('week', TODAY, -1), 1)).toBe(TODAY);
  });

  it('as setas andam um mês no mês', () => {
    expect(periodLabel('month', stepPeriod('month', TODAY, -1))).toBe('outubro de 2026');
  });

  it('as setas andam um ano no ano', () => {
    expect(periodLabel('year', stepPeriod('year', TODAY, -1))).toBe('2025');
    expect(periodBounds('year', TODAY)).toEqual({ start: '2026-01-01', end: '2026-12-31' });
  });
});
