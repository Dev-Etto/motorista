import currency from 'currency.js';

const CENTS_PER_REAL = 100;
const EXACT_PRECISION = 6;
const CENT_DIGITS = 2;
const EXACT = { precision: EXACT_PRECISION };
const DISPLAY = { symbol: 'R$ ', separator: '.', decimal: ',', precision: CENT_DIGITS, pattern: '!#', negativePattern: '-!#' };
const WHOLE = { ...DISPLAY, precision: 0 };
const INPUT = { symbol: '', separator: '', decimal: ',', precision: CENT_DIGITS };

export class Money {
  private constructor(private readonly amount: currency) {}

  static fromCents(cents: number): Money {
    return new Money(currency(cents / CENTS_PER_REAL, EXACT));
  }

  static zero(): Money {
    return Money.fromCents(0);
  }

  static parse(text: string): Money | null {
    const reais = parseDecimal(text);
    return reais === null ? null : new Money(currency(reais, EXACT));
  }

  get cents(): number {
    return this.amount.intValue / 10 ** (EXACT_PRECISION - CENT_DIGITS);
  }

  get wholeCents(): number {
    return Math.round(this.cents);
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

  format(): string {
    return currency(this.wholeCents / CENTS_PER_REAL, DISPLAY).format();
  }

  formatWhole(): string {
    return currency(Math.round(this.cents / CENTS_PER_REAL), WHOLE).format();
  }

  toInput(): string {
    return currency(this.wholeCents / CENTS_PER_REAL, INPUT).format();
  }
}

export const formatBRL = (cents: number) => Money.fromCents(cents).format();

export const parseBRL = (input: string) => Money.parse(input)?.wholeCents ?? null;

const THOUSANDS_ONLY = /^-?\d{1,3}(\.\d{3})+$/;

function normalizeDecimal(clean: string): string {
  if (clean.includes(',')) return clean.replace(/\./g, '').replace(',', '.');
  if (THOUSANDS_ONLY.test(clean)) return clean.replace(/\./g, '');
  return clean;
}

export function parseDecimal(input: string): number | null {
  const clean = input.replace(/R\$|\s/g, '').replace(/[.,]$/, '');
  if (!clean) return null;
  const normalized = normalizeDecimal(clean);
  if (!/^-?\d*\.?\d+$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function formatNumber(value: number, decimals = 1): string {
  const fixed = value.toFixed(decimals);
  const [int = '', frac] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return frac ? `${grouped},${frac}` : grouped;
}

export const centsToInput = (cents: number) => Money.fromCents(cents).toInput();
