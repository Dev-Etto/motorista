import { parseBRL, parseDecimal } from './money';

export const centsOrZero = (text: string) => parseBRL(text) ?? 0;
export const decimalOrZero = (text: string) => parseDecimal(text) ?? 0;
export const decimalOrNull = (text: string) => (text.trim() ? parseDecimal(text) : null);
export const intOrNull = (text: string) => {
  const value = decimalOrNull(text);
  return value === null ? null : Math.round(value);
};
