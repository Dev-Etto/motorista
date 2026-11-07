const DEFAULT_DECIMALS = 1;
const SAMPLE = 1234567.5;
const SPACES = /[\s\u00A0\u202F]/g;
const VALID = /^-?\d*\.?\d+$/;

export interface NumberOptions {
  decimals?: number;
  maxDecimals?: number;
  grouping?: boolean;
}

const numberFormats = new Map<string, Intl.NumberFormat>();

function numberFormat(locale: string, options: NumberOptions): Intl.NumberFormat {
  const minimum = options.maxDecimals === undefined ? (options.decimals ?? DEFAULT_DECIMALS) : 0;
  const maximum = options.maxDecimals ?? options.decimals ?? DEFAULT_DECIMALS;
  const grouping = options.grouping ?? true;
  const key = `${locale}|${minimum}|${maximum}|${grouping}`;
  const cached = numberFormats.get(key);
  if (cached) return cached;

  const created = new Intl.NumberFormat(locale, {
    minimumFractionDigits: minimum,
    maximumFractionDigits: maximum,
    ...(grouping ? {} : { useGrouping: false }),
  });
  numberFormats.set(key, created);
  return created;
}

export function formatNumber(value: number, locale: string, options: NumberOptions = {}): string {
  return numberFormat(locale, options)
    .format(value || 0)
    .replace(/[\u00A0\u202F]/g, ' ');
}

const separators = new Map<string, { decimal: string; group: string }>();

export function separatorsOf(locale: string): { decimal: string; group: string } {
  const cached = separators.get(locale);
  if (cached) return cached;

  const sample = numberFormat(locale, { decimals: 1 }).format(SAMPLE).replace(SPACES, '');
  const decimal = sample.charAt(sample.length - 2);
  const group = sample.replace(/\d/g, '').replace(decimal, '').charAt(0);
  separators.set(locale, { decimal, group });
  return { decimal, group };
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function normalize(clean: string, decimal: string, group: string): string {
  if (group === '') return clean.replace(decimal, '.');

  const groups = new RegExp(escape(group), 'g');
  if (clean.includes(decimal)) return clean.replace(groups, '').replace(decimal, '.');
  if (new RegExp(`^-?\\d{1,3}(${escape(group)}\\d{3})+$`).test(clean)) return clean.replace(groups, '');
  return clean.replace(group, '.');
}

export function parseDecimal(input: string, locale: string): number | null {
  const { decimal, group } = separatorsOf(locale);
  const clean = input.replace(SPACES, '').replace(/[.,]$/, '');
  if (!clean) return null;

  const normalized = normalize(clean, decimal, group);
  if (!VALID.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function decimalToInput(value: number, locale: string, maxDecimals = 2): string {
  const factor = 10 ** maxDecimals;
  return formatNumber(Math.round(value * factor) / factor, locale, { maxDecimals, grouping: false });
}

export function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(value / 100).replace(/[  ]/g, ' ');
}
