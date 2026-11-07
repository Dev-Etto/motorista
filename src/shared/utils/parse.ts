import { MINUTES_PER_HOUR } from '@/shared/utils/time';
import { Money, parseDecimal } from './money';

const LAST_HOUR = 23;

const amountOrNull = (text: string) => {
  const value = parseDecimal(text);
  return value !== null && value >= 0 ? value : null;
};

export const centsOrNull = (text: string) => {
  const money = Money.parse(text);
  return money === null || money.isNegative() ? null : money.wholeCents;
};
export const centsOrZero = (text: string) => centsOrNull(text) ?? 0;
export const decimalOrZero = (text: string) => amountOrNull(text) ?? 0;
export const decimalOrNull = (text: string) => (text.trim() ? amountOrNull(text) : null);
export const intOrNull = (text: string) => {
  const value = decimalOrNull(text);
  return value === null ? null : Math.round(value);
};
export const hasInvalidNumber = (text: string) => text.trim() !== '' && amountOrNull(text) === null;
export const hasInvalidHour = (text: string) => {
  if (text.trim() === '') return false;

  const value = amountOrNull(text);
  return value === null || !Number.isInteger(value) || value > LAST_HOUR;
};

const HOURS_AND_MINUTES = /^(\d+):(\d{1,2})$/;

export function parseHours(text: string): number | null {
  const match = text.trim().match(HOURS_AND_MINUTES);
  if (match) return Number(match[1]) + Number(match[2]) / MINUTES_PER_HOUR;
  return amountOrNull(text);
}

export function decimalToInput(value: number, maxDecimals = 2): string {
  const factor = 10 ** maxDecimals;
  return String(Math.round(value * factor) / factor).replace('.', ',');
}

export function hoursToInput(minutes: number): string {
  const whole = Math.round(minutes);
  const rest = String(whole % MINUTES_PER_HOUR).padStart(2, '0');
  return `${Math.floor(whole / MINUTES_PER_HOUR)}:${rest}`;
}
