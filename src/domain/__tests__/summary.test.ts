import { centsToCsv, csvField, toCsv } from '@/shared/utils/csv';
import { parseDisplayDate } from '@/shared/utils/dates';
import { countsAgainstProfit } from '../expense/expense';
import { summarizeShifts, totalsByPlatform, withLooseExpenses } from '../shift/summary';

describe('despesas', () => {
  it('combustível e manutenção não saem do lucro de novo', () => {
    expect(countsAgainstProfit('fuel')).toBe(false);
    expect(countsAgainstProfit('maintenance')).toBe(false);
    expect(countsAgainstProfit('toll')).toBe(true);
  });
});

describe('resumo', () => {
  const shift = { date: '2026-11-04', startHour: 8, minutes: 480, km: 150, grossCents: 30000, expensesCents: 2000, costPerKm: 64, earnings: [{ platform: 'A', cents: 20000 }, { platform: 'B', cents: 10000 }] };

  it('soma as jornadas', () => {
    const summary = summarizeShifts([shift, shift]);
    expect(summary.grossCents).toBe(60000);
    expect(summary.profitCents).toBe(36800);
    expect(summary.grossPerKm).toBe(200);
    expect(totalsByPlatform([shift])[0]).toEqual({ platform: 'A', cents: 20000 });
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

describe('csv e datas', () => {
  it('neutraliza fórmulas e escapa separadores', () => {
    expect(csvField('=SOMA(A1)')).toBe("'=SOMA(A1)");
    expect(csvField('a;b')).toBe('"a;b"');
    expect(centsToCsv(1234)).toBe('12,34');
    expect(toCsv(['A'], [[1]])).toBe('﻿A\r\n1');
  });

  it('valida datas digitadas', () => {
    expect(parseDisplayDate('04/11/2026')).toBe('2026-11-04');
    expect(parseDisplayDate('31/02/2026')).toBeNull();
    expect(parseDisplayDate('2026-11-04')).toBeNull();
  });
});
