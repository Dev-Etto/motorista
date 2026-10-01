export function csvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: (string | number | null)[][]): string {
  return '﻿' + [header, ...rows].map((row) => row.map(csvField).join(';')).join('\r\n');
}

export function centsToCsv(cents: number): string {
  return (Math.round(cents) / 100).toFixed(2).replace('.', ',');
}
