import { DateTime, Duration } from 'luxon';
import { MS_PER_SECOND } from '@shared/utils/time';

const ISO_DATE = 'yyyy-MM-dd';
const NOON = 12;
const DAYS_PER_WEEK = 7;

export type HourCycle = 'h12' | 'h23';

const dateOf = (iso: string) => DateTime.fromISO(iso).set({ hour: NOON });
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

export const weekdayFromIso = (isoWeekday: number) => isoWeekday % DAYS_PER_WEEK;

export function weekdaysFrom(firstWeekday: number): number[] {
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) => (weekdayFromIso(firstWeekday) + index) % DAYS_PER_WEEK);
}

export function weekBounds(iso: string, firstWeekday: number): { start: string; end: string } {
  const date = dateOf(iso);
  const offset = (weekdayOf(iso) - weekdayFromIso(firstWeekday) + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  const start = date.minus({ days: offset });
  return { start: isoOf(start), end: isoOf(start.plus({ days: DAYS_PER_WEEK - 1 })) };
}

export function formatDate(iso: string, locale: string): string {
  return dateOf(iso).setLocale(locale).toLocaleString({ day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatMonth(iso: string, locale: string): string {
  return dateOf(iso).setLocale(locale).toLocaleString({ month: 'long', year: 'numeric' });
}

const capitalize = (text: string, locale: string) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);

export function formatMonthShort(iso: string, locale: string): string {
  return capitalize(dateOf(iso).setLocale(locale).toLocaleString({ month: 'short' }).replace('.', ''), locale);
}

export function formatHourOfDay(hour: number, locale: string, hourCycle: HourCycle): string {
  return DateTime.fromObject({ hour }).setLocale(locale).toLocaleString({ hour: 'numeric', hourCycle });
}

export function formatLongDay(iso: string, locale: string): string {
  const text = dateOf(iso).setLocale(locale).toLocaleString({ weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

export function formatDayMonth(iso: string, locale: string): string {
  return dateOf(iso).setLocale(locale).toLocaleString({ day: '2-digit', month: '2-digit' });
}

export function formatDayOfMonth(iso: string): string {
  return dateOf(iso).toFormat('dd');
}

export function formatDuration(minutes: number): string {
  const { hours, minutes: rest } = Duration.fromObject({ minutes: Math.max(0, Math.round(minutes)) }).shiftTo('hours', 'minutes');
  if (hours === 0) return `${rest}min`;
  return rest > 0 ? `${hours}h ${String(rest).padStart(2, '0')}min` : `${hours}h`;
}

export function formatClock(elapsedMs: number): string {
  return Duration.fromMillis(Math.max(0, Math.floor(elapsedMs / MS_PER_SECOND) * MS_PER_SECOND)).toFormat('hh:mm:ss');
}

const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const HOURS_PER_DAY = 24;

export type ElapsedParts = { hours: number; minutes: number; overDay: boolean };

export function elapsedParts(elapsedMs: number): ElapsedParts {
  const total = Math.max(0, Math.floor(elapsedMs / MS_PER_SECOND / MINUTES_PER_HOUR));
  const hours = Math.floor(total / MINUTES_PER_HOUR);
  return { hours, minutes: total % MINUTES_PER_HOUR, overDay: hours >= HOURS_PER_DAY };
}

export function clockAfter(startHour: number, minutes: number): string {
  const total = (startHour * MINUTES_PER_HOUR + Math.round(minutes)) % (HOURS_PER_DAY * MINUTES_PER_HOUR);
  return `${String(Math.floor(total / MINUTES_PER_HOUR)).padStart(2, '0')}:${String(total % MINUTES_PER_HOUR).padStart(2, '0')}`;
}

export function formatElapsedShort(elapsedMs: number): string {
  const { hours, minutes, overDay } = elapsedParts(elapsedMs);
  if (overDay) return `${HOURS_PER_DAY}H+`;
  if (hours === 0) return `${minutes}M:${String(Math.max(0, Math.floor(elapsedMs / MS_PER_SECOND) % SECONDS_PER_MINUTE)).padStart(2, '0')}`;
  return `${hours}H:${String(minutes).padStart(2, '0')}`;
}

export type DayPeriod = 'dawn' | 'morning' | 'afternoon' | 'night';

export function dayPeriod(hour: number): DayPeriod {
  if (hour < 6) return 'dawn';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'night';
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

export const clockOfMillis = (millis: number) => DateTime.fromMillis(millis).toFormat('HH:mm');

export function nextClockTime(after: number, minutesOfDay: number): number {
  const start = DateTime.fromMillis(after);
  const candidate = start.startOf('day').plus({ minutes: minutesOfDay });
  return (candidate <= start ? candidate.plus({ days: 1 }) : candidate).toMillis();
}
