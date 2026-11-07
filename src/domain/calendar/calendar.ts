import { addDays, fromISODate, monthBounds } from '@/shared/utils/dates';

export interface CalendarFact {
  date: string;
  profitCents: number;
}

export interface CalendarDay {
  date: string;
  day: number;
  profitCents: number | null;
}

const DAYS_PER_WEEK = 7;

export function buildCalendar(monthDate: string, facts: CalendarFact[]): (CalendarDay | null)[][] {
  const { start, days } = monthBounds(monthDate);
  const totals = new Map<string, number>();
  for (const fact of facts) totals.set(fact.date, (totals.get(fact.date) ?? 0) + fact.profitCents);

  const leadingBlanks = (fromISODate(start).getDay() + 6) % DAYS_PER_WEEK;
  const cells: (CalendarDay | null)[] = Array.from({ length: leadingBlanks }, () => null);
  for (let index = 0; index < days; index++) {
    const date = addDays(start, index);
    cells.push({ date, day: index + 1, profitCents: totals.get(date) ?? null });
  }
  while (cells.length % DAYS_PER_WEEK !== 0) cells.push(null);

  return Array.from({ length: cells.length / DAYS_PER_WEEK }, (_, week) => cells.slice(week * DAYS_PER_WEEK, (week + 1) * DAYS_PER_WEEK));
}
