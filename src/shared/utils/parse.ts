import { parseBRL, parseDecimal } from './money';

export const centsOrZero = (text: string) => parseBRL(text) ?? 0;
export const decimalOrZero = (text: string) => parseDecimal(text) ?? 0;
export const decimalOrNull = (text: string) => (text.trim() ? parseDecimal(text) : null);
export const intOrNull = (text: string) => {
  const value = decimalOrNull(text);
  return value === null ? null : Math.round(value);
};
export const hasInvalidNumber = (text: string) => text.trim() !== '' && parseDecimal(text) === null;

const HOURS_AND_MINUTES = /^(\d+):(\d{1,2})$/;
const MINUTES_PER_HOUR = 60;

export function parseHours(text: string): number | null {
  const match = text.trim().match(HOURS_AND_MINUTES);
  if (match) return Number(match[1]) + Number(match[2]) / MINUTES_PER_HOUR;
  return parseDecimal(text);
}
