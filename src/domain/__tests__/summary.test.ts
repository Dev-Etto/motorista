import { countsAgainstProfit } from '@domain/expense/expense';
import { summarizeShifts, totalsByPlatform, withLooseExpenses } from '@domain/shift/summary';
import { centsToCsv, csvField, toCsv } from '@shared/utils/csv';

describe('despesas', () => {
  it('combustível e manutenção não saem do lucro de novo', () => {
    expect(countsAgainstProfit('fuel')).toBe(false);
    expect(countsAgainstProfit('maintenance')).toBe(false);
    expect(countsAgainstProfit('toll')).toBe(true);
  });
});

describe('resumo', () => {
  const shift = {
    date: '2026-11-04',
    startHour: 8,
    minutes: 480,
    km: 150,
    grossCents: 30000,
    expensesCents: 2000,
    costPerKm: 64,
    earnings: [
      { platform: 'A', cents: 20000 },
      { platform: 'B', cents: 10000 },
    ],
  };

  it('soma as jornadas', () => {
    const summary = summarizeShifts([shift, shift]);
    expect(summary.grossCents).toBe(60000);
    expect(summary.profitCents).toBe(36800);
    expect(summary.grossPerKm).toBe(200);
    expect(totalsByPlatform([shift])[0]).toEqual({ platform: 'A', cents: 20000 });
  });

  it('jornada sem horas não infla o valor por hora', () => {
    const untimed = { ...shift, minutes: 0 };
    const summary = summarizeShifts([shift, untimed]);
    expect(summary.grossCents).toBe(60000);
    expect(summary.grossPerHour).toBe(3750);
    expect(summary.profitPerHour).toBe(2300);
  });

  it('despesa avulsa reduz o lucro', () => {
    const summary = withLooseExpenses(summarizeShifts([shift]), 1000);
    expect(summary.profitCents).toBe(17400);
    expect(summary.profitPerHour).toBe(2175);
  });

  it('período vazio não divide por zero', () => {
    const summary = summarizeShifts([]);
    expect(summary.grossPerKm).toBeNull();
    expect(summary.profitPerHour).toBeNull();
  });
});

describe('csv', () => {
  it('neutraliza fórmulas e escapa separadores', () => {
    expect(csvField('=SOMA(A1)')).toBe("'=SOMA(A1)");
    expect(csvField('a;b')).toBe('"a;b"');
    expect(centsToCsv(1234, { locale: 'pt-BR', currency: 'BRL' })).toBe('12,34');
    expect(toCsv(['A'], [[1]])).toBe('﻿A\r\n1');
  });
});

describe('jornadas sem km no resumo', () => {
  const base = { startHour: 8, minutes: 480, grossCents: 30000, expensesCents: 0, costPerKm: 100, earnings: [], date: '2026-11-05' };

  it('calcula o R$/km só com as jornadas que têm km', () => {
    const summary = summarizeShifts([
      { ...base, km: 100 },
      { ...base, km: null },
    ]);
    expect(summary.grossPerKm).toBe(300);
  });

  it('conta as jornadas parciais', () => {
    const summary = summarizeShifts([
      { ...base, km: 100 },
      { ...base, km: null },
      { ...base, km: 50, costPerKm: 0 },
    ]);
    expect(summary.partialCount).toBe(2);
  });
});
