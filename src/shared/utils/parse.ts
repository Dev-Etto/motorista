import { MINUTES_PER_HOUR } from '@shared/utils/time';
import { Money, type MoneyFormat } from './money';
import { parseDecimal } from './numbers';

const LAST_HOUR = 23;
const HOURS_AND_MINUTES = /^(\d+):(\d{1,2})$/;

export const amountOrNull = (text: string, locale: string) => {
  const value = parseDecimal(text, locale);
  return value !== null && value >= 0 ? value : null;
};

export const centsOrNull = (text: string, spec: MoneyFormat) => {
  const money = Money.parse(text, spec);
  return money === null || money.isNegative() ? null : money.wholeCents;
};

export const centsOrZero = (text: string, spec: MoneyFormat) => centsOrNull(text, spec) ?? 0;

export const decimalOrZero = (text: string, locale: string) => amountOrNull(text, locale) ?? 0;

export const decimalOrNull = (text: string, locale: string) => (text.trim() ? amountOrNull(text, locale) : null);

export const intOrNull = (text: string, locale: string) => {
  const value = decimalOrNull(text, locale);
  return value === null ? null : Math.round(value);
};

export const hasInvalidNumber = (text: string, locale: string) => text.trim() !== '' && amountOrNull(text, locale) === null;

export function hasInvalidHour(text: string, locale: string): boolean {
  if (text.trim() === '') return false;

  const value = amountOrNull(text, locale);
  return value === null || !Number.isInteger(value) || value > LAST_HOUR;
}

export function parseHours(text: string, locale: string): number | null {
  const match = text.trim().match(HOURS_AND_MINUTES);
  if (match) return Number(match[1]) + Number(match[2]) / MINUTES_PER_HOUR;
  return amountOrNull(text, locale);
}

export function hoursToInput(minutes: number): string {
  const whole = Math.round(minutes);
  const rest = String(whole % MINUTES_PER_HOUR).padStart(2, '0');
  return `${Math.floor(whole / MINUTES_PER_HOUR)}:${rest}`;
}
