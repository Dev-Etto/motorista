export interface GoalInput {
  desiredProfitCents: number;
  fixedMonthlyCents: number;
  plannedKm: number;
  variablePerKm: number;
  grossSoFarCents: number;
  workDaysLeft: number;
}

export const DEFAULT_WORK_WEEKDAYS = [1, 2, 3, 4, 5, 6];

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
