import type { CostBreakdown } from '@domain/vehicle/costs';
import { costParts, costShares } from '@domain/vehicle/costShares';

const costs = { fuelPerKm: 38, oilPerKm: 4, tiresPerKm: 5, maintenancePerKm: 5, fixedPerKm: 17 } as CostBreakdown;

describe('de onde vem o custo por km', () => {
  it('junta óleo, pneus e manutenção em desgaste', () => {
    expect(costParts(costs)).toEqual({ fuel: 38, wear: 14, fixed: 17 });
  });

  it('divide em fatias que somam 1', () => {
    const shares = costShares(costs);
    expect(shares.fuel + shares.wear + shares.fixed).toBeCloseTo(1);
    expect(shares.fuel).toBeCloseTo(38 / 69);
  });

  it('sem custo, fatias zeradas', () => {
    expect(costShares({ fuelPerKm: 0, oilPerKm: 0, tiresPerKm: 0, maintenancePerKm: 0, fixedPerKm: 0 } as CostBreakdown)).toEqual({
      fuel: 0,
      wear: 0,
      fixed: 0,
    });
  });
});
