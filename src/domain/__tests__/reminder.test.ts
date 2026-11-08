import { isDueByKm, kmFor, kmRemaining, reminderUrgency } from '@domain/reminder/reminder';

describe('lembrete por km', () => {
  it('vence quando o total de km chega ao combinado', () => {
    expect(isDueByKm({ dueKm: 10000, done: false }, 10000)).toBe(true);
    expect(isDueByKm({ dueKm: 10000, done: false }, 9999)).toBe(false);
  });

  it('não vence se já foi concluído ou não é por km', () => {
    expect(isDueByKm({ dueKm: 10000, done: true }, 20000)).toBe(false);
    expect(isDueByKm({ dueKm: null, done: false }, 20000)).toBe(false);
  });

  it('diz quanto falta, sem número negativo', () => {
    expect(kmRemaining(10000, 9200)).toBe(800);
    expect(kmRemaining(10000, 12000)).toBe(0);
  });
});

describe('km do lembrete por veículo', () => {
  const totals = { all: 140, byVehicle: { 1: 100, 2: 40 } };

  it('lembrete de um veículo conta só o km dele', () => {
    expect(kmFor(2, totals)).toBe(40);
    expect(kmFor(3, totals)).toBe(0);
  });

  it('lembrete antigo, sem veículo, conta todas as jornadas', () => {
    expect(kmFor(null, totals)).toBe(140);
  });
});

describe('urgência do lembrete', () => {
  const base = { dueKm: null, dueDate: null, totalKm: 48320, today: '2026-11-07', soonDate: '2026-11-14' };

  it('passou do km ou da data, está atrasado', () => {
    expect(reminderUrgency({ ...base, dueKm: 48000 })).toBe('overdue');
    expect(reminderUrgency({ ...base, dueDate: '2026-11-06' })).toBe('overdue');
  });

  it('faltando até 1.000 km ou 7 dias, vem em breve', () => {
    expect(reminderUrgency({ ...base, dueKm: 49000 })).toBe('soon');
    expect(reminderUrgency({ ...base, dueDate: '2026-11-14' })).toBe('soon');
  });

  it('longe do km e da data, sem selo', () => {
    expect(reminderUrgency({ ...base, dueKm: 53000, dueDate: '2026-12-15' })).toBeNull();
  });
});
