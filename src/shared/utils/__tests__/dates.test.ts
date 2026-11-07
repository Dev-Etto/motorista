import {
  addDays,
  addMonths,
  datesInRange,
  dayRange,
  daysBetween,
  formatClock,
  formatDate,
  formatDuration,
  formatMonth,
  monthBounds,
  toISODate,
  toJsDate,
  weekBounds,
  weekdayOf,
  workDaysInMonth,
  workDaysLeft,
} from '../dates';

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
    expect(weekBounds('2026-11-05')).toEqual({ start: '2026-11-02', end: '2026-11-08' });
    expect(weekBounds('2026-11-08')).toEqual({ start: '2026-11-02', end: '2026-11-08' });
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
    expect(formatDate('2026-11-05')).toBe('05/11/2026');
    expect(formatMonth('2026-11-05')).toBe('novembro de 2026');
    expect(formatDuration(125)).toBe('2h 05min');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(45)).toBe('45min');
    expect(formatClock(3725000)).toBe('01:02:05');
  });
});
