import { getDb } from '@/data/database/connection';

export interface MonthlyGoal {
  month: string;
  desiredProfitCents: number;
  workWeekdays: number[];
}

interface GoalRow {
  month: string;
  desired_profit_cents: number;
  work_weekdays: string;
}

export const goalRepository = {
  async find(month: string): Promise<MonthlyGoal | null> {
    const row = await getDb().getFirstAsync<GoalRow>('SELECT * FROM goals WHERE month = ?', month);
    if (!row) return null;

    return {
      month: row.month,
      desiredProfitCents: row.desired_profit_cents,
      workWeekdays: JSON.parse(row.work_weekdays) as number[],
    };
  },

  async save(goal: MonthlyGoal): Promise<void> {
    await getDb().runAsync(
      `INSERT INTO goals (month, desired_profit_cents, work_weekdays) VALUES (?, ?, ?)
       ON CONFLICT(month) DO UPDATE SET desired_profit_cents = excluded.desired_profit_cents, work_weekdays = excluded.work_weekdays`,
      goal.month,
      goal.desiredProfitCents,
      JSON.stringify(goal.workWeekdays),
    );
  },
};
