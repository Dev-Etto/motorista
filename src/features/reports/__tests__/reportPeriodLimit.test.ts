import { startsAfter } from '@features/reports/reportPeriod';

describe('não avança para o futuro', () => {
  it('no período atual, o próximo começa depois de hoje', () => {
    expect(startsAfter('month', '2026-11-07', 1, '2026-11-07')).toBe(true);
    expect(startsAfter('year', '2026-11-07', 1, '2026-11-07')).toBe(true);
    expect(startsAfter('week', '2026-11-07', 1, '2026-11-07')).toBe(true);
  });

  it('num período passado, ainda dá para avançar', () => {
    expect(startsAfter('month', '2026-10-15', 1, '2026-11-07')).toBe(false);
    expect(startsAfter('week', '2026-10-28', 1, '2026-11-07')).toBe(false);
  });
});
