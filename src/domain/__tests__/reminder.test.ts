import { isDueByKm, kmRemaining } from '@domain/reminder/reminder';

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
