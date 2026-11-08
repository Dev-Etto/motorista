import type { CostBreakdown } from './costs';

export interface CostShares {
  fuel: number;
  wear: number;
  fixed: number;
}

export function costParts(costs: CostBreakdown): CostShares {
  return { fuel: costs.fuelPerKm, wear: costs.oilPerKm + costs.tiresPerKm + costs.maintenancePerKm, fixed: costs.fixedPerKm };
}

export function costShares(costs: CostBreakdown): CostShares {
  const parts = costParts(costs);
  const total = parts.fuel + parts.wear + parts.fixed;
  if (total <= 0) return { fuel: 0, wear: 0, fixed: 0 };
  return { fuel: parts.fuel / total, wear: parts.wear / total, fixed: parts.fixed / total };
}
