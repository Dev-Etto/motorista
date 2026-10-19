import { goalRepository } from '@/data/repositories/goalRepository';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { computeGoal } from '@/domain/goal/goal';
import { monthBounds, monthKey, workDaysLeft } from '@/shared/utils/dates';

export async function loadGoalProgress(date: string) {
  const goal = await goalRepository.find(monthKey(date));
  if (!goal) return null;

  const { start, end } = monthBounds(date);
  const [{ costs, profile }, facts] = await Promise.all([vehicleRepository.getCostsAt(date), shiftRepository.listFacts(start, end)]);
  const grossSoFarCents = facts.reduce((total, fact) => total + fact.grossCents, 0);

  return {
    goal,
    ...computeGoal({
      desiredProfitCents: goal.desiredProfitCents,
      fixedMonthlyCents: costs?.fixedMonthly ?? 0,
      plannedKm: profile?.plannedKmMonth ?? 0,
      variablePerKm: costs?.variablePerKm ?? 0,
      grossSoFarCents,
      workDaysLeft: workDaysLeft(date, goal.workWeekdays),
    }),
    grossSoFarCents,
  };
}
