import { periodBounds as boundsFrom, periodLabel as labelWith, periodNoun, stepPeriod } from '@features/reports/reportPeriod';
import { i18n } from '@shared/i18n';
import { createFormatter, DEFAULT_FORMAT } from '@shared/i18n/format';

const t = i18n.getFixedT('pt-BR', 'reports');
const format = createFormatter(DEFAULT_FORMAT);
const periodBounds = (period: 'week' | 'month' | 'year', date: string) => boundsFrom(period, date, DEFAULT_FORMAT.firstWeekday);
const periodLabel = (period: 'week' | 'month' | 'year', date: string) => labelWith(period, date, format, t);

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

describe('período com a semana começando no domingo', () => {
  const sunday = createFormatter({ ...DEFAULT_FORMAT, firstWeekday: 7, locale: 'en-US' });

  it('mostra a semana de domingo a sábado no formato da região', () => {
    expect(boundsFrom('week', TODAY, 7)).toEqual({ start: '2026-11-01', end: '2026-11-07' });
    expect(labelWith('week', TODAY, sunday, t)).toBe('11/01 a 11/07');
  });
});

describe('nome do período', () => {
  it('traduz semana, mês e ano', () => {
    expect(periodNoun('week', t)).toBe('Semana');
    expect(periodNoun('month', t)).toBe('Mês');
    expect(periodNoun('year', t)).toBe('Ano');
  });
});
