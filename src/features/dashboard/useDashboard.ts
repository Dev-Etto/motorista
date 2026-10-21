import { expenseRepository } from '@/data/repositories/expenseRepository';
import { reminderRepository } from '@/data/repositories/reminderRepository';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { summarizeShifts, withLooseExpenses } from '@/domain/shift/summary';
import { BACKUP_REMINDER_DAYS } from '@/config/app';
import { loadGoalProgress } from '@/features/goals/goalProgress';
import { loadInsights } from '@/features/insights/loadInsights';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { monthBounds, today, weekBounds } from '@/shared/utils/dates';

const MS_PER_DAY = 86400000;

function isBackupDue(lastBackupAt: string | null, hasShifts: boolean): boolean {
  if (!hasShifts) return false;
  if (!lastBackupAt) return true;
  return Date.now() - Number(lastBackupAt) > BACKUP_REMINDER_DAYS * MS_PER_DAY;
}

async function loadDashboard() {
  const date = today();
  const week = weekBounds(date);
  const month = monthBounds(date);
  const [monthFacts, weekFacts, { costs }, goal, insights, lastBackupAt, reminders, odometer, looseToday, looseWeek, looseMonth] = await Promise.all([
    shiftRepository.listFacts(month.start, month.end),
    shiftRepository.listFacts(week.start, week.end),
    vehicleRepository.getCostsAt(date),
    loadGoalProgress(date),
    loadInsights(date),
    settingsRepository.get(SETTING_KEYS.lastBackupAt),
    reminderRepository.list(),
    shiftRepository.latestOdometer(),
    expenseRepository.totalLooseCountable(date, date),
    expenseRepository.totalLooseCountable(week.start, week.end),
    expenseRepository.totalLooseCountable(month.start, month.end),
  ]);
  const dueKmReminders = reminders.filter((reminder) => !reminder.done && reminder.due_km !== null && odometer !== null && odometer >= reminder.due_km);

  return {
    costs,
    goal,
    today: withLooseExpenses(summarizeShifts(monthFacts.filter((fact) => fact.date === date)), looseToday),
    week: withLooseExpenses(summarizeShifts(weekFacts), looseWeek),
    month: withLooseExpenses(summarizeShifts(monthFacts), looseMonth),
    topInsight: insights[0] ?? null,
    backupDue: isBackupDue(lastBackupAt, monthFacts.length > 0),
    dueKmReminders,
  };
}

export const useDashboard = () => useAsyncData(loadDashboard);
