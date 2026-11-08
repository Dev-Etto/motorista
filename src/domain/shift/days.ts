export interface DayShift {
  date: string;
  km: number | null;
  profitCents: number;
}

export interface ShiftDay<T extends DayShift> {
  date: string;
  shifts: T[];
  km: number;
  profitCents: number;
}

export function groupShiftsByDay<T extends DayShift>(shifts: T[]): ShiftDay<T>[] {
  const days = new Map<string, ShiftDay<T>>();
  [...shifts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((shift) => {
      const day = days.get(shift.date) ?? { date: shift.date, shifts: [], km: 0, profitCents: 0 };
      day.shifts.push(shift);
      day.km += shift.km ?? 0;
      day.profitCents += shift.profitCents;
      days.set(shift.date, day);
    });
  return [...days.values()];
}
