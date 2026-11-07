import Constants from 'expo-constants';
import { loadGoalProgress } from '@application/goalProgress';
import { loadInsights } from '@application/insights';
import { loadNextStep } from '@application/nextStep';
import { BACKUP_REMINDER_DAYS, UPDATE_REMINDER_DAYS } from '@config/app';
import { expenseRepository } from '@data/repositories/expenseRepository';
import { gpsSessionRepository } from '@data/repositories/gpsSessionRepository';
import { reminderRepository } from '@data/repositories/reminderRepository';
import { SETTING_KEYS, settingsRepository } from '@data/repositories/settingsRepository';
import { shiftRepository } from '@data/repositories/shiftRepository';
import { vehicleRepository } from '@data/repositories/vehicleRepository';
import { isBackupDue, isUpdateDue } from '@domain/maintenance/notices';
import { estimateEarnings } from '@domain/offer/offerLog';
import { isDueByKm } from '@domain/reminder/reminder';
import { summarizeShifts, withLooseExpenses } from '@domain/shift/summary';
import { copilot } from '@modules/copilot';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { useFormat } from '@shared/i18n/format';
import { readGpsProblem } from '@shared/platform/location';
import { dayRange, monthBounds, today, weekBounds } from '@shared/utils/dates';

async function loadDashboard(firstWeekday: number) {
  const date = today();
  const week = weekBounds(date, firstWeekday);
  const month = monthBounds(date);
  const [monthFacts, weekFacts, { costs }, goal, insights, lastBackupAt, reminders, totalKm, looseToday, looseWeek, looseMonth] = await Promise.all([
    shiftRepository.listFacts(month.start, month.end),
    shiftRepository.listFacts(week.start, week.end),
    vehicleRepository.getCostsAt(date),
    loadGoalProgress(date),
    loadInsights(date),
    settingsRepository.get(SETTING_KEYS.lastBackupAt),
    reminderRepository.list(),
    shiftRepository.totalKmEver(),
    expenseRepository.totalLooseCountable(date, date),
    expenseRepository.totalLooseCountable(week.start, week.end),
    expenseRepository.totalLooseCountable(month.start, month.end),
  ]);
  const [nextStep, gpsSession] = await Promise.all([loadNextStep(), gpsSessionRepository.get()]);
  const copilotStatus = copilot.getStatus();
  const measuring = gpsSession.running && copilot.getTimer().running;
  const gpsProblem = measuring ? await readGpsProblem() : null;
  const dueKmReminders = reminders.filter((reminder) => isDueByKm({ dueKm: reminder.dueKm, done: reminder.done }, totalKm));

  return {
    costs,
    missingFixedCosts: costs !== null && costs.fixedMonthly === 0,
    goal,
    today: withLooseExpenses(summarizeShifts(monthFacts.filter((fact) => fact.date === date)), looseToday),
    week: withLooseExpenses(summarizeShifts(weekFacts), looseWeek),
    month: withLooseExpenses(summarizeShifts(monthFacts), looseMonth),
    topInsight: insights[0] ?? null,
    backupDue: nextStep?.id !== 'first-backup' && isBackupDue(lastBackupAt, monthFacts.length > 0, Date.now(), BACKUP_REMINDER_DAYS),
    updateDue: isUpdateDue(Constants.expoConfig?.extra?.buildDate, Date.now(), UPDATE_REMINDER_DAYS),
    dueKmReminders,
    nextStep,
    gpsRunning: measuring && gpsProblem === null,
    gpsProblem,
    copilotStopped: copilotStatus.enabled && !copilotStatus.accessibilityGranted,
    estimatedToday: copilot.getPreferences().estimateEarnings ? estimateEarnings(await copilot.getOffers(dayRange(date).from, dayRange(date).to)) : null,
  };
}

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

export function useDashboard() {
  const { firstWeekday } = useFormat().profile;
  return useAsyncData(() => loadDashboard(firstWeekday), [firstWeekday]);
}
