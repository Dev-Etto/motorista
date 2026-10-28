import { getDb } from '@/data/database/connection';

export interface MonthlyGoal {
  month: string;
  desiredProfitCents: number;
  workWeekdays: number[];
  hoursPerDay: number;
}

interface GoalRow {
  month: string;
  desired_profit_cents: number;
  work_weekdays: string;
  hours_per_day: number;
}

export const goalRepository = {
  async find(month: string): Promise<MonthlyGoal | null> {
    const row = await getDb().getFirstAsync<GoalRow>('SELECT * FROM goals WHERE month = ?', month);
    if (!row) return null;

    return {
      month: row.month,
      desiredProfitCents: row.desired_profit_cents,
      workWeekdays: JSON.parse(row.work_weekdays) as number[],
      hoursPerDay: row.hours_per_day,
    };
  },

  async findDayOverride(date: string): Promise<number | null> {
    const row = await getDb().getFirstAsync<{ target_cents: number }>('SELECT target_cents FROM goal_day_overrides WHERE date = ?', date);
    return row?.target_cents ?? null;
  },

  async saveDayOverride(date: string, targetCents: number | null): Promise<void> {
    if (targetCents === null) {
      await getDb().runAsync('DELETE FROM goal_day_overrides WHERE date = ?', date);
      return;
    }
    await getDb().runAsync(
      `INSERT INTO goal_day_overrides (date, target_cents) VALUES (?, ?)
       ON CONFLICT(date) DO UPDATE SET target_cents = excluded.target_cents`,
      date,
      targetCents,
    );
  },

  async save(goal: MonthlyGoal): Promise<void> {
    await getDb().runAsync(
      `INSERT INTO goals (month, desired_profit_cents, work_weekdays, hours_per_day) VALUES (?, ?, ?, ?)
       ON CONFLICT(month) DO UPDATE SET desired_profit_cents = excluded.desired_profit_cents,
       work_weekdays = excluded.work_weekdays, hours_per_day = excluded.hours_per_day`,
      goal.month,
      goal.desiredProfitCents,
      JSON.stringify(goal.workWeekdays),
      goal.hoursPerDay,
    );
  },
};
