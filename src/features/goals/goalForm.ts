import { Formatter } from '@shared/i18n/format';

export const MIN_HOURS_PER_DAY = 1;
export const MAX_HOURS_PER_DAY = 24;

export interface GoalFormValues {
  desired: string;
  hoursPerDay: string;
  weekdays: number[];
  dayTarget: string;
}

export type GoalField = 'desired' | 'hoursPerDay' | 'weekdays' | 'dayTarget';

export type GoalFormErrors = Partial<Record<GoalField, true>>;

export function validateGoalForm(values: GoalFormValues, format: Formatter): GoalFormErrors {
  const errors: GoalFormErrors = {};
  const hours = format.parseDecimal(values.hoursPerDay);
  if (!format.parseCents(values.desired)) errors.desired = true;
  if (!hours || hours < MIN_HOURS_PER_DAY || hours > MAX_HOURS_PER_DAY) errors.hoursPerDay = true;
  if (values.weekdays.length === 0) errors.weekdays = true;
  if (format.hasInvalidNumber(values.dayTarget)) errors.dayTarget = true;
  return errors;
}

export const hasGoalErrors = (errors: GoalFormErrors) => Object.keys(errors).length > 0;
