export interface GoalPlanInput {
  desiredProfitCents: number;
  fixedMonthlyCents: number;
  plannedKm: number;
  variablePerKm: number;
}

export interface GoalProgressInput {
  desiredProfitCents: number;
  profitSoFarCents: number;
  profitTodayCents: number;
  expensesTodayCents: number;
  todayIsWorkDay: boolean;
  workDaysLeft: number;
  dayOverrideCents: number | null;
  costPerKm: number | null;
  plannedKmPerDay: number;
}

export const DEFAULT_WORK_WEEKDAYS = [1, 2, 3, 4, 5, 6];
export const DEFAULT_HOURS_PER_DAY = 8;

export const requiredGrossForGoal = (plan: GoalPlanInput) => plan.desiredProfitCents + plan.fixedMonthlyCents + plan.plannedKm * plan.variablePerKm;

export function computeGoalProgress(goal: GoalProgressInput) {
  const remainingCents = Math.max(0, goal.desiredProfitCents - goal.profitSoFarCents);
  const remainingAtDayStart = Math.max(0, goal.desiredProfitCents - (goal.profitSoFarCents - goal.profitTodayCents));
  const remainingToSplit = goal.todayIsWorkDay ? remainingAtDayStart : remainingCents;
  const computedTarget = goal.workDaysLeft > 0 ? remainingToSplit / goal.workDaysLeft : null;
  const expensesToCover = goal.todayIsWorkDay ? goal.expensesTodayCents : 0;
  const dailyTargetCents = goal.dayOverrideCents ?? computedTarget;

  return {
    remainingCents,
    reached: goal.profitSoFarCents >= goal.desiredProfitCents,
    surplusCents: Math.max(0, goal.profitSoFarCents - goal.desiredProfitCents),
    progress: goal.desiredProfitCents > 0 ? Math.min(1, Math.max(0, goal.profitSoFarCents / goal.desiredProfitCents)) : 0,
    dailyTargetCents,
    leftTodayCents: dailyTargetCents === null ? null : Math.max(0, dailyTargetCents - goal.profitTodayCents),
    grossForDayCents: dailyTargetCents === null || goal.costPerKm === null ? null : dailyTargetCents + goal.plannedKmPerDay * goal.costPerKm + expensesToCover,
  };
}

export interface TargetSuggestionInput {
  requiredGrossCents: number;
  plannedKm: number;
  workDaysInMonth: number;
  hoursPerDay: number;
}

const SUGGESTION_STEP_CENTS = 10;

const roundUp = (cents: number) => Math.ceil(cents / SUGGESTION_STEP_CENTS) * SUGGESTION_STEP_CENTS;

export function suggestOfferTargets(input: TargetSuggestionInput) {
  const hours = input.workDaysInMonth * input.hoursPerDay;
  if (input.requiredGrossCents <= 0 || input.plannedKm <= 0 || hours <= 0) return null;

  return {
    targetPerKmCents: roundUp(input.requiredGrossCents / input.plannedKm),
    targetPerHourCents: roundUp(input.requiredGrossCents / hours),
    grossPerWorkDayCents: input.requiredGrossCents / input.workDaysInMonth,
  };
}
