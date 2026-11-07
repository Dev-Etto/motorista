import type { TFunction } from 'i18next';
import type { Formatter } from '@shared/i18n/format';

export interface GoalDayFacts {
  reached: boolean;
  surplusCents: number;
  remainingCents: number;
  workDaysLeft: number;
  todayIsWorkDay: boolean;
  dailyTargetCents: number | null;
  leftTodayCents: number | null;
  grossForDayCents: number | null;
  plannedKmPerDay: number;
}

function describeDayEffort(facts: GoalDayFacts, t: TFunction<'goals'>, format: Formatter): string[] {
  if (facts.grossForDayCents === null || facts.plannedKmPerDay <= 0) return [];
  return [t('day.effort', { gross: format.money(facts.grossForDayCents), distance: format.distance(facts.plannedKmPerDay, 0) })];
}

function describeDayOff(facts: GoalDayFacts, dailyTargetCents: number, t: TFunction<'goals'>, format: Formatter): string {
  const target = format.money(dailyTargetCents);
  const plan = facts.workDaysLeft === 1 ? t('day.planLastDay', { target }) : t('day.planNextDays', { count: facts.workDaysLeft, target });
  return [t('day.notWorkDay'), plan, ...describeDayEffort(facts, t, format)].join(' ');
}

export function describeGoalDay(facts: GoalDayFacts, t: TFunction<'goals'>, format: Formatter): string {
  if (facts.reached) {
    return facts.surplusCents > 0 ? t('day.reachedWithSurplus', { surplus: format.money(facts.surplusCents) }) : t('day.reached');
  }
  if (facts.dailyTargetCents === null) return t('day.noDaysLeft', { remaining: format.money(facts.remainingCents) });
  if (!facts.todayIsWorkDay) return describeDayOff(facts, facts.dailyTargetCents, t, format);
  if (facts.leftTodayCents === 0) return t('day.todayReached');

  const daysLeft = facts.workDaysLeft === 1 ? t('day.lastDay') : t('day.daysLeft', { count: facts.workDaysLeft });
  return [t('day.leftToday', { amount: format.money(facts.leftTodayCents ?? 0) }), ...describeDayEffort(facts, t, format), daysLeft].join(' ');
}

export const describePartialShifts = (count: number, t: TFunction<'goals'>) => t('partialShifts', { count });
