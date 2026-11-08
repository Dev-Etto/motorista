import { useState } from 'react';
import { addDays, today, weekBounds } from '@shared/utils/dates';

const DAYS_PER_WEEK = 7;

export function useWeekCursor(firstWeekday: number) {
  const [date, setDate] = useState(today());

  return {
    ...weekBounds(date, firstWeekday),
    previous: () => setDate((current) => addDays(current, -DAYS_PER_WEEK)),
    next: () => setDate((current) => addDays(current, DAYS_PER_WEEK)),
  };
}
