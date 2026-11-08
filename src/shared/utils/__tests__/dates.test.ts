import {
  addDays,
  addMonths,
  datesInRange,
  formatDayOfMonth,
  formatMonthShort,
  dayRange,
  daysBetween,
  formatClock,
  formatElapsedShort,
  formatDate,
  formatDuration,
  formatMonth,
  monthBounds,
  toISODate,
  toJsDate,
  weekBounds,
  weekdayOf,
  weekdaysFrom,
  formatHourOfDay,
  workDaysInMonth,
  workDaysLeft,
} from '@shared/utils/dates';

describe('datas', () => {
  it('soma dias e meses sem pular a troca de mês', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-01');
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-01');
  });

  it('atravessa a troca de horário de verão sem perder o dia', () => {
    expect(addDays('2018-11-03', 1)).toBe('2018-11-04');
    expect(addDays('2018-11-04', 1)).toBe('2018-11-05');
  });

  it('calcula mês e semana', () => {
    expect(monthBounds('2026-02-10')).toEqual({ start: '2026-02-01', end: '2026-02-28', days: 28 });
    expect(weekBounds('2026-11-05', 1)).toEqual({ start: '2026-11-02', end: '2026-11-08' });
    expect(weekBounds('2026-11-08', 1)).toEqual({ start: '2026-11-02', end: '2026-11-08' });
  });

  it('dá o dia da semana com domingo em 0', () => {
    expect(weekdayOf('2026-11-08')).toBe(0);
    expect(weekdayOf('2026-11-09')).toBe(1);
  });

  it('conta dias entre datas e lista o intervalo', () => {
    expect(daysBetween('2026-11-01', '2026-11-08')).toBe(7);
    expect(datesInRange('2026-11-29', '2026-12-01')).toEqual(['2026-11-29', '2026-11-30', '2026-12-01']);
  });

  it('conta os dias de trabalho', () => {
    expect(workDaysInMonth('2026-11-15', [1, 2, 3, 4, 5])).toBe(21);
    expect(workDaysLeft('2026-11-27', [1, 2, 3, 4, 5])).toBe(2);
  });

  it('converte para a data do aparelho', () => {
    expect(toISODate(new Date(2026, 10, 5, 23, 30))).toBe('2026-11-05');
    expect(toJsDate('2026-11-05', 8).getHours()).toBe(8);
    expect(toJsDate('2026-11-05').getDate()).toBe(5);
    const { from, to } = dayRange('2026-11-05');
    expect(to - from).toBe(24 * 60 * 60 * 1000);
  });

  it('formata como antes', () => {
    expect(formatDate('2026-11-05', 'pt-BR')).toBe('05/11/2026');
    expect(formatMonth('2026-11-05', 'pt-BR')).toBe('novembro de 2026');
    expect(formatDuration(125)).toBe('2h 05min');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(45)).toBe('45min');
    expect(formatClock(3725000)).toBe('01:02:05');
  });
});

describe('rótulos curtos do gráfico', () => {
  it('mês abreviado com inicial maiúscula e sem ponto', () => {
    expect(['2026-01-01', '2026-02-01', '2026-03-01', '2026-05-01', '2026-08-01', '2026-12-01'].map((iso) => formatMonthShort(iso, 'pt-BR'))).toEqual([
      'Jan',
      'Fev',
      'Mar',
      'Mai',
      'Ago',
      'Dez',
    ]);
  });

  it('dia do mês com dois dígitos', () => {
    expect(formatDayOfMonth('2026-11-02')).toBe('02');
  });
});

describe('semana pelo primeiro dia escolhido', () => {
  it('começa no domingo', () => {
    expect(weekBounds('2026-11-05', 7)).toEqual({ start: '2026-11-01', end: '2026-11-07' });
    expect(weekBounds('2026-11-08', 7)).toEqual({ start: '2026-11-08', end: '2026-11-14' });
  });

  it('começa no sábado', () => {
    expect(weekBounds('2026-11-05', 6)).toEqual({ start: '2026-10-31', end: '2026-11-06' });
  });

  it('ordena os dias a partir do primeiro, com domingo em 0', () => {
    expect(weekdaysFrom(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(weekdaysFrom(7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('formatos de data por região', () => {
  it.each([
    ['pt-BR', '05/11/2026', 'novembro de 2026', 'Nov'],
    ['en-US', '11/05/2026', 'November 2026', 'Nov'],
    ['es-MX', '05/11/2026', 'noviembre de 2026', 'Nov'],
    ['es-ES', '05/11/2026', 'noviembre de 2026', 'Nov'],
  ])('%s', (locale, date, month, short) => {
    expect(formatDate('2026-11-05', locale)).toBe(date);
    expect(formatMonth('2026-11-05', locale)).toBe(month);
    expect(formatMonthShort('2026-11-05', locale)).toBe(short);
  });

  it('hora do dia em 24 ou 12 horas', () => {
    expect(formatHourOfDay(20, 'pt-BR', 'h23')).toBe('20');
    expect(formatHourOfDay(20, 'en-US', 'h12')).toMatch(/^8\sPM$/);
  });
});

describe('tempo de jornada abreviado', () => {
  const MINUTE = 60_000;

  it.each([
    [0, '<1min'],
    [45 * MINUTE, '45min'],
    [120 * MINUTE, '2h'],
    [134 * MINUTE + 59_000, '2h14'],
    [750 * MINUTE, '12h30'],
    [24 * 60 * MINUTE, '24h+'],
    [-MINUTE, '<1min'],
  ])('%i ms vira %s', (elapsedMs, text) => {
    expect(formatElapsedShort(elapsedMs)).toBe(text);
  });
});
