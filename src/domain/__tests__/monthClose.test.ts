import { proratedFixedMonthly } from '@domain/report/report';

const FIXED: Record<string, number> = { car: 100000, moto: 20000, current: 50000 };
const fixedOf = (vehicleId: number | null) => (vehicleId === 1 ? FIXED.car! : vehicleId === 2 ? FIXED.moto! : FIXED.current!);

describe('custo fixo do mês com mais de um veículo', () => {
  it('sem jornada, usa o veículo atual', () => {
    expect(proratedFixedMonthly([], fixedOf)).toBe(50000);
  });

  it('um veículo no mês leva o custo fixo inteiro dele', () => {
    expect(
      proratedFixedMonthly(
        [
          { date: '2026-11-02', vehicleId: 1 },
          { date: '2026-11-02', vehicleId: 1 },
        ],
        fixedOf,
      ),
    ).toBe(100000);
  });

  it('dois veículos dividem pelos dias com jornada de cada um', () => {
    const shifts = [
      { date: '2026-11-02', vehicleId: 1 },
      { date: '2026-11-03', vehicleId: 1 },
      { date: '2026-11-03', vehicleId: 1 },
      { date: '2026-11-04', vehicleId: 2 },
    ];
    expect(proratedFixedMonthly(shifts, fixedOf)).toBeCloseTo((100000 * 2) / 3 + 20000 / 3);
  });

  it('jornada sem veículo conta para o atual', () => {
    expect(
      proratedFixedMonthly(
        [
          { date: '2026-11-02', vehicleId: null },
          { date: '2026-11-03', vehicleId: 2 },
        ],
        fixedOf,
      ),
    ).toBeCloseTo(35000);
  });
});
