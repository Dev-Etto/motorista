import { Money, MoneyFormat } from './money';
import { separatorsOf } from './numbers';

const NUMERIC = /^-?\d+([.,]\d+)?$/;
const COMMA = ',';
const SEMICOLON = ';';

export const csvSeparatorFor = (locale: string) => (separatorsOf(locale).decimal === COMMA ? SEMICOLON : COMMA);

export function csvField(value: string | number | null | undefined, separator = SEMICOLON): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && !NUMERIC.test(text) && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  const needsQuotes = text.includes(separator) || /["\n\r]/.test(text);
  return needsQuotes ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: (string | number | null)[][], separator = SEMICOLON): string {
  return '\uFEFF' + [header, ...rows].map((row) => row.map((value) => csvField(value, separator)).join(separator)).join('\r\n');
}

export const centsToCsv = (cents: number, spec: MoneyFormat) => Money.fromCents(cents).toInput(spec);
