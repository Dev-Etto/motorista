import { parseDecimal } from './money';

const CENTS_PER_REAL = 100;
const LAST_HOUR = 23;

const amountOrNull = (text: string) => {
  const value = parseDecimal(text);
  return value !== null && value >= 0 ? value : null;
};

export const centsOrNull = (text: string) => {
  const value = amountOrNull(text);
  return value === null ? null : Math.round(value * CENTS_PER_REAL);
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
const MINUTES_PER_HOUR = 60;

export function parseHours(text: string): number | null {
  const match = text.trim().match(HOURS_AND_MINUTES);
  if (match) return Number(match[1]) + Number(match[2]) / MINUTES_PER_HOUR;
  return amountOrNull(text);
}
