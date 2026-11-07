export function formatBRL(cents: number): string {
  const rounded = Math.round(cents);
  const negative = rounded < 0;
  const abs = Math.abs(rounded);
  const reais = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  const grouped = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}R$ ${grouped},${frac}`;
}

export function parseBRL(input: string): number | null {
  const value = parseDecimal(input);
  return value === null ? null : Math.round(value * 100);
}

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
  const [int, frac] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return frac ? `${grouped},${frac}` : grouped;
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}
