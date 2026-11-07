import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { TFunction } from 'i18next';
import { APP_NAME } from '@config/app';
import { computeShift } from '@domain/shift/shift';
import { i18n } from '@shared/i18n';
import type { Formatter } from '@shared/i18n/format';
import { shareTextFile } from '@shared/platform/share';
import { centsToCsv, csvSeparatorFor, toCsv } from '@shared/utils/csv';
import { ReportData } from './useReport';

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const tableRow = (cells: string[]) => `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`;

export function buildReportHtml(report: ReportData, format: Formatter, t: TFunction<'reports'>, language: string): string {
  const { summary } = report;
  const summaryRows = [
    [t('pdf.gross'), format.money(summary.grossCents)],
    [t('pdf.vehicleCost'), format.money(summary.vehicleCostCents)],
    [t('pdf.expenses'), format.money(summary.expensesCents)],
    [t('pdf.estimatedProfit'), format.money(summary.profitCents)],
    [t('pdf.distance'), format.distance(summary.km)],
    [t('pdf.time'), format.duration(summary.minutes)],
    [t('pdf.grossPerKm', { context: format.distanceUnit }), format.perDistance(summary.grossPerKm)],
    [t('pdf.profitPerHour'), format.perHour(summary.profitPerHour)],
  ].map(tableRow);
  const headers = [t('pdf.date'), t('pdf.gross'), t('pdf.distance'), t('pdf.time'), t('pdf.profit')].map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const shiftRows = report.shifts.map((shift) =>
    tableRow([
      format.date(shift.date),
      format.money(shift.grossCents),
      format.distance(shift.km),
      format.duration(shift.minutes),
      format.money(computeShift(shift).profitCents),
    ]),
  );

  return `<html lang="${escapeHtml(language)}"><head><meta charset="utf-8"><style>
    body { font-family: sans-serif; color: #171717; padding: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    td, th { border-bottom: 1px solid #E2E2E2; padding: 6px; text-align: left; font-size: 12px; }
    small { color: #5E5E5E; }
  </style></head><body>
    <h1>${escapeHtml(t('pdf.title', { app: APP_NAME }))}</h1>
    <p>${escapeHtml(t('pdf.range', { start: format.date(report.start), end: format.date(report.end) }))}</p>
    <h2>${escapeHtml(t('pdf.summary'))}</h2><table>${summaryRows.join('')}</table>
    <h2>${escapeHtml(t('pdf.shifts'))}</h2><table>
      <tr>${headers}</tr>
      ${shiftRows.join('')}
    </table>
    <small>${escapeHtml(t('pdf.footer'))}</small>
  </body></html>`;
}

export async function shareReportPdf(report: ReportData, format: Formatter, t: TFunction<'reports'>): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: buildReportHtml(report, format, t, i18n.language) });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}

export function buildReportCsv(report: Pick<ReportData, 'shifts'>, format: Formatter, t: TFunction<'reports'>): string {
  const spec = format.profile;
  const currency = { currency: spec.currency };
  const unit = { context: format.distanceUnit, ...currency };
  const header = [
    t('csv.date'),
    t('csv.gross', currency),
    t('csv.distance', unit),
    t('csv.minutes'),
    t('csv.expenses', currency),
    t('csv.profit', currency),
    t('csv.costPerDistance', unit),
  ];
  const rows = report.shifts.map((shift) => [
    shift.date,
    centsToCsv(shift.grossCents, spec),
    shift.km === null ? null : format.distanceInput(shift.km),
    shift.minutes,
    centsToCsv(shift.expensesCents, spec),
    centsToCsv(computeShift(shift).profitCents, spec),
    format.perDistanceInput(shift.costPerKm),
  ]);
  return toCsv(header, rows, csvSeparatorFor(spec.locale));
}

export async function shareReportCsv(report: ReportData, format: Formatter, t: TFunction<'reports'>): Promise<void> {
  await shareTextFile(t('csv.fileName', { start: report.start, end: report.end }), buildReportCsv(report, format, t), 'text/csv');
}
