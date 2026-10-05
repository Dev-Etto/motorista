import { useState } from 'react';
import { addMonths, today } from '@/shared/utils/dates';

export function useMonthCursor() {
  const [date, setDate] = useState(today());

  return {
    date,
    previous: () => setDate((current) => addMonths(current, -1)),
    next: () => setDate((current) => addMonths(current, 1)),
  };
}
