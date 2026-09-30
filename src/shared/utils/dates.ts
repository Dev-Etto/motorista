const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function monthBounds(iso: string): { start: string; end: string; days: number } {
  const d = fromISODate(iso);
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const prefix = monthKey(iso);
  return { start: `${prefix}-01`, end: `${prefix}-${pad(days)}`, days };
}

export function addDays(iso: string, delta: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

export function addMonths(iso: string, delta: number): string {
  const d = fromISODate(iso);
  const target = new Date(d.getFullYear(), d.getMonth() + delta, 1, 12);
  return toISODate(target);
}

export function weekBounds(iso: string): { start: string; end: string } {
  const day = fromISODate(iso).getDay();
  const start = addDays(iso, -((day + 6) % 7));
  return { start, end: addDays(start, 6) };
}

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function weekdayName(index: number): string {
  return WEEKDAYS[index];
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function formatMonth(iso: string): string {
  const d = fromISODate(iso);
  return `${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${pad(m)}min` : ''}` : `${m}min`;
}

export type DayPeriod = 'madrugada' | 'manhã' | 'tarde' | 'noite';

export function dayPeriod(hour: number): DayPeriod {
  if (hour < 6) return 'madrugada';
  if (hour < 12) return 'manhã';
  if (hour < 18) return 'tarde';
  return 'noite';
}

export function workDaysLeft(todayISO: string, workWeekdays: number[]): number {
  const { end } = monthBounds(todayISO);
  let count = 0;
  for (let cur = todayISO; cur <= end; cur = addDays(cur, 1)) {
    if (workWeekdays.includes(fromISODate(cur).getDay())) count++;
  }
  return count;
}

export function parseDisplayDate(text: string): string | null {
  const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const [day, month, year] = match.slice(1).map(Number);
  const iso = `${year}-${pad(month)}-${pad(day)}`;
  return toISODate(fromISODate(iso)) === iso ? iso : null;
}

export const today = () => toISODate(new Date());
