export interface GoalInput {
  desiredProfitCents: number;
  fixedMonthlyCents: number;
  plannedKm: number;
  variablePerKm: number;
  grossSoFarCents: number;
  workDaysLeft: number;
}

export const DEFAULT_WORK_WEEKDAYS = [1, 2, 3, 4, 5, 6];
export const DEFAULT_HOURS_PER_DAY = 8;

export function computeGoal(goal: GoalInput) {
  const requiredGrossCents = goal.desiredProfitCents + goal.fixedMonthlyCents + goal.plannedKm * goal.variablePerKm;
  const remainingCents = Math.max(0, requiredGrossCents - goal.grossSoFarCents);

  return {
    requiredGrossCents,
    remainingCents,
    dailyTargetCents: goal.workDaysLeft > 0 ? remainingCents / goal.workDaysLeft : remainingCents,
    progress: requiredGrossCents > 0 ? Math.min(1, goal.grossSoFarCents / requiredGrossCents) : 0,
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
