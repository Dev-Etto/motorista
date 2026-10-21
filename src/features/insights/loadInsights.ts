import { expenseRepository } from '@/data/repositories/expenseRepository';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { buildInsights } from '@/domain/insights/buildInsights';
import { addDays } from '@/shared/utils/dates';

const LOOKBACK_DAYS = 90;

export async function loadInsights(date: string) {
  const start = addDays(date, -LOOKBACK_DAYS);
  const [shifts, { costs, profile }, fuelPaidCents, fuelKm] = await Promise.all([
    shiftRepository.listFacts(start, date),
    vehicleRepository.getCostsAt(date),
    expenseRepository.totalPaidFuel(start, date),
    shiftRepository.totalKm(start, date),
  ]);

  return buildInsights({ today: date, shifts, costs, plannedKmMonth: profile?.plannedKmMonth ?? 0, fuelPaidCents, fuelKm });
}
