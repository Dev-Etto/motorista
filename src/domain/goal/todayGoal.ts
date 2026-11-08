const PERCENT = 100;

export interface TodayGoalInput {
  todayIsWorkDay: boolean;
  dailyTargetCents: number | null;
  profitTodayCents: number;
}

export interface TodayGoal {
  percent: number;
  remainingCents: number;
  progress: number;
}

export function todayGoal({ todayIsWorkDay, dailyTargetCents, profitTodayCents }: TodayGoalInput): TodayGoal | null {
  if (!todayIsWorkDay || dailyTargetCents === null || dailyTargetCents <= 0) return null;

  const progress = Math.max(0, profitTodayCents) / dailyTargetCents;
  return {
    percent: Math.round(progress * PERCENT),
    remainingCents: Math.max(0, dailyTargetCents - profitTodayCents),
    progress: Math.min(1, progress),
  };
}
