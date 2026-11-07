import currency from 'currency.js';
import { formatNumber, parseDecimal } from './numbers';

const CENTS_PER_UNIT = 100;
const EXACT_PRECISION = 6;
const CENT_DIGITS = 2;
const EXACT = { precision: EXACT_PRECISION };
const WIDE_SPACES = /[\u00A0\u202F]/g;

export interface MoneyFormat {
  locale: string;
  currency: string;
}

const currencyFormats = new Map<string, Intl.NumberFormat>();

function currencyFormat(spec: MoneyFormat, whole: boolean): Intl.NumberFormat {
  const key = `${spec.locale}|${spec.currency}|${whole}`;
  const cached = currencyFormats.get(key);
  if (cached) return cached;

  const digits = whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {};
  const created = new Intl.NumberFormat(spec.locale, { style: 'currency', currency: spec.currency, ...digits });
  currencyFormats.set(key, created);
  return created;
}

export const fractionDigitsOf = (spec: MoneyFormat) => currencyFormat(spec, false).resolvedOptions().maximumFractionDigits ?? CENT_DIGITS;

export const currencySymbolOf = (spec: MoneyFormat) =>
  currencyFormat(spec, true)
    .format(0)
    .replace(/[\d\s\u00A0\u202F.,-]/g, '');

const withPlainSpaces = (text: string) => text.replace(WIDE_SPACES, ' ');

const withoutNegativeZero = (value: number) => value || 0;

export class Money {
  private constructor(private readonly amount: currency) {}

  static fromCents(cents: number): Money {
    return new Money(currency(cents / CENTS_PER_UNIT, EXACT));
  }

  static zero(): Money {
    return Money.fromCents(0);
  }

  static parse(text: string, spec: MoneyFormat): Money | null {
    const units = parseDecimal(text.replace(currencySymbolOf(spec), ''), spec.locale);
    return units === null ? null : new Money(currency(units, EXACT));
  }

  get cents(): number {
    return this.amount.intValue / 10 ** (EXACT_PRECISION - CENT_DIGITS);
  }

  get wholeCents(): number {
    return withoutNegativeZero(Math.round(this.cents));
  }

  plus(other: Money): Money {
    return new Money(this.amount.add(other.amount));
  }

  minus(other: Money): Money {
    return new Money(this.amount.subtract(other.amount));
  }

  times(factor: number): Money {
    return new Money(this.amount.multiply(factor));
  }

  dividedBy(divisor: number): Money {
    return new Money(this.amount.divide(divisor));
  }

  isNegative(): boolean {
    return this.wholeCents < 0;
  }

  format(spec: MoneyFormat): string {
    return withPlainSpaces(currencyFormat(spec, false).format(this.wholeCents / CENTS_PER_UNIT));
  }

  formatWhole(spec: MoneyFormat): string {
    return withPlainSpaces(currencyFormat(spec, true).format(withoutNegativeZero(Math.round(this.cents / CENTS_PER_UNIT))));
  }

  toInput(spec: MoneyFormat): string {
    const digits = fractionDigitsOf(spec);
    return formatNumber(this.wholeCents / CENTS_PER_UNIT, spec.locale, { decimals: digits });
  }
}
