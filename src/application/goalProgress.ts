import { expenseRepository } from '@/data/repositories/expenseRepository';
import { goalRepository } from '@/data/repositories/goalRepository';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { computeGoalProgress, requiredGrossForGoal, suggestOfferTargets } from '@/domain/goal/goal';
import { summarizeShifts, withLooseExpenses } from '@/domain/shift/summary';
import { monthBounds, monthKey, weekdayOf, workDaysInMonth, workDaysLeft } from '@/shared/utils/dates';

export async function loadGoalProgress(date: string) {
  const goal = await goalRepository.find(monthKey(date));
  if (!goal) return null;

  const { start, end } = monthBounds(date);
  const [{ costs, profile }, facts, dayOverride, looseMonth, looseToday] = await Promise.all([
    vehicleRepository.getCostsAt(date),
    shiftRepository.listFacts(start, end),
    goalRepository.findDayOverride(date),
    expenseRepository.totalLooseCountable(start, end),
    expenseRepository.totalLooseCountable(date, date),
  ]);

  const month = withLooseExpenses(summarizeShifts(facts), looseMonth);
  const today = withLooseExpenses(summarizeShifts(facts.filter((fact) => fact.date === date)), looseToday);
  const plannedKm = profile?.plannedKmMonth ?? 0;
  const workDays = workDaysInMonth(date, goal.workWeekdays);
  const plannedKmPerDay = workDays > 0 ? plannedKm / workDays : 0;
  const daysLeft = workDaysLeft(date, goal.workWeekdays);
  const todayIsWorkDay = goal.workWeekdays.includes(weekdayOf(date));
  const requiredGrossCents = requiredGrossForGoal({
    desiredProfitCents: goal.desiredProfitCents,
    fixedMonthlyCents: costs?.fixedMonthly ?? 0,
    plannedKm,
    variablePerKm: costs?.variablePerKm ?? 0,
  });

  return {
    goal,
    dayOverride,
    requiredGrossCents,
    plannedKmPerDay,
    workDaysLeft: daysLeft,
    todayIsWorkDay,
    profitSoFarCents: month.profitCents,
    profitTodayCents: today.profitCents,
    partialCount: month.partialCount,
    ...computeGoalProgress({
      desiredProfitCents: goal.desiredProfitCents,
      profitSoFarCents: month.profitCents,
      profitTodayCents: today.profitCents,
      expensesTodayCents: today.expensesCents,
      todayIsWorkDay,
      workDaysLeft: daysLeft,
      dayOverrideCents: dayOverride,
      costPerKm: costs?.fullPerKm ?? null,
      plannedKmPerDay,
    }),
    suggestion: suggestOfferTargets({ requiredGrossCents, plannedKm, workDaysInMonth: workDays, hoursPerDay: goal.hoursPerDay }),
  };
}
