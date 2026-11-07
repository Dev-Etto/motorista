import { formatNumber, parseDecimal, separatorsOf } from './numbers';

const MAX_INTEGER_DIGITS = 9;
const DURATION_DIGITS = 4;
const HOUR_DIGITS = 2;
const NOT_DIGIT = /\D/g;
const NOT_NUMERIC = /[^\d.,]/g;

function decimalIndex(text: string, decimal: string): number {
  if (text.includes(decimal)) return text.indexOf(decimal);

  const last = text.length - 1;
  return /[.,]/.test(text.charAt(last)) ? last : -1;
}

function groupDigits(digits: string, group: string): string {
  if (!group) return digits;
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, group);
}

const withoutLeadingZeros = (digits: string) => digits.replace(/^0+(?=\d)/, '');

export function maskDecimal(text: string, locale: string, maxDecimals: number): string {
  const { decimal, group } = separatorsOf(locale);
  const cleaned = text.replace(NOT_NUMERIC, '');
  const at = maxDecimals > 0 ? decimalIndex(cleaned, decimal) : -1;
  const integerPart = at < 0 ? cleaned : cleaned.slice(0, at);
  const digits = withoutLeadingZeros(integerPart.replace(NOT_DIGIT, '').slice(0, MAX_INTEGER_DIGITS));
  const whole = groupDigits(digits, group);
  if (at < 0) return whole;

  const fraction = cleaned
    .slice(at + 1)
    .replace(NOT_DIGIT, '')
    .slice(0, maxDecimals);
  return `${whole || '0'}${decimal}${fraction}`;
}

export function completeDecimals(text: string, locale: string, decimals: number): string {
  const value = parseDecimal(text, locale);
  if (value === null) return text;
  return formatNumber(value, locale, { decimals });
}

export const maskInteger = (text: string, maxDigits = MAX_INTEGER_DIGITS) => text.replace(NOT_DIGIT, '').slice(0, maxDigits);

export function maskDuration(text: string): string {
  const digits = text.replace(NOT_DIGIT, '').slice(0, DURATION_DIGITS);
  if (digits.length <= HOUR_DIGITS) return digits;
  return `${digits.slice(0, HOUR_DIGITS)}:${digits.slice(HOUR_DIGITS)}`;
}
