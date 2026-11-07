import { ReportPeriod } from '@/domain/report/report';
import { addDays, addMonths, formatDate, formatMonth, monthBounds, weekBounds } from '@/shared/utils/dates';

const DAYS_IN_WEEK = 7;
const MONTHS_IN_YEAR = 12;

export function periodBounds(period: ReportPeriod, date: string) {
  if (period === 'week') return weekBounds(date);
  if (period === 'month') return monthBounds(date);
  const year = date.slice(0, 4);
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function stepPeriod(period: ReportPeriod, date: string, direction: 1 | -1): string {
  if (period === 'week') return addDays(date, DAYS_IN_WEEK * direction);
  return addMonths(date, (period === 'month' ? 1 : MONTHS_IN_YEAR) * direction);
}

export function periodLabel(period: ReportPeriod, date: string): string {
  if (period === 'month') return formatMonth(date);
  if (period === 'year') return date.slice(0, 4);
  const { start, end } = weekBounds(date);
  return `${formatDate(start).slice(0, 5)} a ${formatDate(end).slice(0, 5)}`;
}

export const PERIOD_NOUNS: Record<ReportPeriod, string> = { week: 'Semana', month: 'Mês', year: 'Ano' };
