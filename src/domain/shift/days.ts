import { addDays } from '@shared/utils/dates';

const DAYS_PER_WEEK = 7;

export interface DayShift {
  date: string;
  km: number | null;
  profitCents: number;
}

export interface DayExpense {
  date: string;
  cents: number;
  countable: boolean;
}

export interface ShiftDay<T extends DayShift, E extends DayExpense = DayExpense> {
  date: string;
  shifts: T[];
  expenses: E[];
  km: number;
  profitCents: number;
}

export function groupShiftsByDay<T extends DayShift, E extends DayExpense = DayExpense>(shifts: T[], expenses: E[] = []): ShiftDay<T, E>[] {
  const days = new Map<string, ShiftDay<T, E>>();
  const dayOf = (date: string) => days.get(date) ?? { date, shifts: [], expenses: [], km: 0, profitCents: 0 };

  shifts.forEach((shift) => {
    const day = dayOf(shift.date);
    day.shifts.push(shift);
    day.km += shift.km ?? 0;
    day.profitCents += shift.profitCents;
    days.set(shift.date, day);
  });
  expenses.forEach((expense) => {
    const day = dayOf(expense.date);
    day.expenses.push(expense);
    if (expense.countable) day.profitCents -= expense.cents;
    days.set(expense.date, day);
  });
  return [...days.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export interface WeekDay {
  date: string;
  profitCents: number | null;
}

export function buildWeek(start: string, days: { date: string; profitCents: number }[]): WeekDay[] {
  const totals = new Map(days.map((day) => [day.date, day.profitCents]));
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) => {
    const date = addDays(start, index);
    return { date, profitCents: totals.get(date) ?? null };
  });
}
