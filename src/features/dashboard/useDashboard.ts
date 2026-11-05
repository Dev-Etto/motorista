import { readGpsProblem } from '@/features/shifts/gpsStatus';
import { expenseRepository } from '@/data/repositories/expenseRepository';
import { reminderRepository } from '@/data/repositories/reminderRepository';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { shiftRepository } from '@/data/repositories/shiftRepository';
import { vehicleRepository } from '@/data/repositories/vehicleRepository';
import { copilot } from '@modules/copilot';
import { gpsSessionRepository } from '@/data/repositories/gpsSessionRepository';
import { summarizeShifts, withLooseExpenses } from '@/domain/shift/summary';
import Constants from 'expo-constants';
import { BACKUP_REMINDER_DAYS, UPDATE_REMINDER_DAYS } from '@/config/app';
import { isBackupDue, isUpdateDue } from '@/domain/maintenance/notices';
import { estimateEarnings } from '@/domain/offer/offerLog';
import { loadGoalProgress } from '@/features/goals/goalProgress';
import { loadInsights } from '@/features/insights/loadInsights';
import { loadNextStep } from '@/features/onboarding/nextStep';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { dayRange, monthBounds, today, weekBounds } from '@/shared/utils/dates';

async function loadDashboard() {
  const date = today();
  const week = weekBounds(date);
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
  const dueKmReminders = reminders.filter((reminder) => !reminder.done && reminder.due_km !== null && totalKm >= reminder.due_km);

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
    estimatedToday: copilot.getPreferences().estimateEarnings ? estimateEarnings(copilot.getOffers(dayRange(date).from, dayRange(date).to)) : null,
  };
}

export const useDashboard = () => useAsyncData(loadDashboard);
