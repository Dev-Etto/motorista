import { DateTime, Duration } from 'luxon';
import { MS_PER_SECOND } from '@/shared/utils/time';

const LOCALE = 'pt-BR';
const ISO_DATE = 'yyyy-MM-dd';
const NOON = 12;
const DAYS_PER_WEEK = 7;
const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const dateOf = (iso: string) => DateTime.fromISO(iso, { locale: LOCALE }).set({ hour: NOON });
const isoOf = (date: DateTime) => date.toFormat(ISO_DATE);

export function toISODate(date: Date): string {
  return isoOf(DateTime.fromJSDate(date));
}

export function isoFromMillis(millis: number): string {
  return isoOf(DateTime.fromMillis(millis));
}

export function hourOfMillis(millis: number): number {
  return DateTime.fromMillis(millis).hour;
}

export function toJsDate(iso: string, hour = NOON): Date {
  return dateOf(iso).set({ hour, minute: 0, second: 0, millisecond: 0 }).toJSDate();
}

export function weekdayOf(iso: string): number {
  return dateOf(iso).weekday % DAYS_PER_WEEK;
}

export function daysBetween(from: string, to: string): number {
  return Math.round(dateOf(to).diff(dateOf(from), 'days').days);
}

export function dayRange(iso: string): { from: number; to: number } {
  const start = dateOf(iso).startOf('day');
  return { from: start.toMillis(), to: start.plus({ days: 1 }).toMillis() };
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function monthBounds(iso: string): { start: string; end: string; days: number } {
  const date = dateOf(iso);
  return { start: isoOf(date.startOf('month')), end: isoOf(date.endOf('month')), days: date.daysInMonth ?? 0 };
}

export function addDays(iso: string, delta: number): string {
  return isoOf(dateOf(iso).plus({ days: delta }));
}

export function addMonths(iso: string, delta: number): string {
  return isoOf(dateOf(iso).startOf('month').plus({ months: delta }));
}

export function weekBounds(iso: string): { start: string; end: string } {
  const start = dateOf(iso).startOf('week');
  return { start: isoOf(start), end: isoOf(start.plus({ days: DAYS_PER_WEEK - 1 })) };
}

export function weekdayName(index: number): string {
  return WEEKDAYS[index] ?? '';
}

export function formatDate(iso: string): string {
  return dateOf(iso).toFormat('dd/MM/yyyy');
}

export function formatMonth(iso: string): string {
  return dateOf(iso).toFormat("LLLL 'de' yyyy");
}

export function formatDuration(minutes: number): string {
  const { hours, minutes: rest } = Duration.fromObject({ minutes: Math.max(0, Math.round(minutes)) }).shiftTo('hours', 'minutes');
  if (hours === 0) return `${rest}min`;
  return rest > 0 ? `${hours}h ${String(rest).padStart(2, '0')}min` : `${hours}h`;
}

export function formatClock(elapsedMs: number): string {
  return Duration.fromMillis(Math.max(0, Math.floor(elapsedMs / MS_PER_SECOND) * MS_PER_SECOND)).toFormat('hh:mm:ss');
}

export type DayPeriod = 'madrugada' | 'manhã' | 'tarde' | 'noite';

export function dayPeriod(hour: number): DayPeriod {
  if (hour < 6) return 'madrugada';
  if (hour < 12) return 'manhã';
  if (hour < 18) return 'tarde';
  return 'noite';
}

export function datesInRange(start: string, end: string): string[] {
  const count = daysBetween(start, end) + 1;
  return Array.from({ length: Math.max(0, count) }, (_, index) => addDays(start, index));
}

export function workDaysLeft(todayISO: string, workWeekdays: number[]): number {
  return datesInRange(todayISO, monthBounds(todayISO).end).filter((date) => workWeekdays.includes(weekdayOf(date))).length;
}

export function workDaysInMonth(iso: string, workWeekdays: number[]): number {
  return workDaysLeft(monthBounds(iso).start, workWeekdays);
}

export const today = () => isoOf(DateTime.local());
