import type { TFunction } from 'i18next';
import { ReportPeriod } from '@domain/report/report';
import type { Formatter } from '@shared/i18n/format';
import { addDays, addMonths, monthBounds, weekBounds } from '@shared/utils/dates';
import { MONTHS_PER_YEAR } from '@shared/utils/time';

const DAYS_IN_WEEK = 7;

export function periodBounds(period: ReportPeriod, date: string, firstWeekday: number) {
  if (period === 'week') return weekBounds(date, firstWeekday);
  if (period === 'month') return monthBounds(date);
  const year = date.slice(0, 4);
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function stepPeriod(period: ReportPeriod, date: string, direction: 1 | -1): string {
  if (period === 'week') return addDays(date, DAYS_IN_WEEK * direction);
  return addMonths(date, (period === 'month' ? 1 : MONTHS_PER_YEAR) * direction);
}

export function startsAfter(period: ReportPeriod, date: string, firstWeekday: number, todayIso: string): boolean {
  return periodBounds(period, stepPeriod(period, date, 1), firstWeekday).start > todayIso;
}

export function periodLabel(period: ReportPeriod, date: string, format: Formatter, t: TFunction<'reports'>): string {
  if (period === 'month') return format.month(date);
  if (period === 'year') return date.slice(0, 4);
  const { start, end } = format.weekBounds(date);
  return t('weekRange', { start: format.dayMonth(start), end: format.dayMonth(end) });
}

export const periodNoun = (period: ReportPeriod, t: TFunction<'reports'>) => t(`period.${period}`);
