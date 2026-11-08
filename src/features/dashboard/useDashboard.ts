import Constants from 'expo-constants';
import { loadGoalProgress } from '@application/goalProgress';
import { loadNextStep } from '@application/nextStep';
import { BACKUP_REMINDER_DAYS, UPDATE_REMINDER_DAYS } from '@config/app';
import { expenseRepository } from '@data/repositories/expenseRepository';
import { gpsSessionRepository } from '@data/repositories/gpsSessionRepository';
import { reminderRepository } from '@data/repositories/reminderRepository';
import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { shiftRepository } from '@data/repositories/shiftRepository';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { todayGoal } from '@domain/goal/todayGoal';
import { isBackupDue, isUpdateDue } from '@domain/maintenance/notices';
import { isDueByKm, kmFor } from '@domain/reminder/reminder';
import { summarizeShifts, withLooseExpenses } from '@domain/shift/summary';
import { copilot } from '@modules/copilot';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { useFormat } from '@shared/i18n/format';
import { readGpsProblem } from '@shared/platform/location';
import { dayRange, monthBounds, today } from '@shared/utils/dates';

async function loadDashboard(firstWeekday: number) {
  const date = today();
  const month = monthBounds(date);
  const [monthFacts, { vehicle, costs }, goal, lastBackupAt, reminders, kmTotals, looseToday] = await Promise.all([
    shiftRepository.listFacts(month.start, month.end),
    vehicleRepository.getCostsAt(date),
    loadGoalProgress(date),
    settingsRepository.get(SETTING_KEYS.lastBackupAt),
    reminderRepository.list(),
    shiftRepository.kmTotals(),
    expenseRepository.totalLooseCountable(date, date),
  ]);
  const [nextStep, gpsSession, recentOffers] = await Promise.all([loadNextStep(), gpsSessionRepository.get(), copilot.getRecentOffers(1)]);
  const lastOffer = recentOffers.find((entry) => entry.timestamp >= dayRange(date).from) ?? null;
  const copilotStatus = copilot.getStatus();
  const measuring = gpsSession.running && copilot.getTimer().running;
  const gpsProblem = measuring ? await readGpsProblem() : null;
  const dueKmReminders = reminders.filter((reminder) => isDueByKm({ dueKm: reminder.dueKm, done: reminder.done }, kmFor(reminder.vehicleId, kmTotals)));

  return {
    costs,
    vehicle,
    lastOffer,
    loadedAt: Date.now(),
    todayGoal: goal ? todayGoal(goal) : null,
    missingFixedCosts: costs !== null && costs.fixedMonthly === 0,
    goal,
    today: withLooseExpenses(summarizeShifts(monthFacts.filter((fact) => fact.date === date)), looseToday),
    backupDue: nextStep?.id !== 'first-backup' && isBackupDue(lastBackupAt, monthFacts.length > 0, Date.now(), BACKUP_REMINDER_DAYS),
    updateDue: isUpdateDue(Constants.expoConfig?.extra?.buildDate, Date.now(), UPDATE_REMINDER_DAYS),
    dueKmReminders,
    nextStep,
    gpsProblem,
    copilotStopped: copilotStatus.enabled && !copilotStatus.accessibilityGranted,
  };
}

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

export function useDashboard() {
  const { firstWeekday } = useFormat().profile;
  return useAsyncData(() => loadDashboard(firstWeekday), [firstWeekday]);
}
