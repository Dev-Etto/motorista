import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { APP_NAME } from '@/config/app';
import { computeShift } from '@/domain/shift/shift';
import { shareTextFile } from '@/shared/platform/share';
import { centsToCsv, toCsv } from '@/shared/utils/csv';
import { formatDate, formatDuration } from '@/shared/utils/dates';
import { formatKm, formatPerHour, formatPerKm } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';
import { ReportData } from './useReport';

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const tableRow = (cells: string[]) => `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`;

function buildReportHtml(report: ReportData): string {
  const { summary } = report;
  const summaryRows = [
    ['Faturamento', formatBRL(summary.grossCents)],
    ['Custo do veículo', formatBRL(summary.vehicleCostCents)],
    ['Despesas', formatBRL(summary.expensesCents)],
    ['Lucro estimado', formatBRL(summary.profitCents)],
    ['Distância', formatKm(summary.km)],
    ['Tempo', formatDuration(summary.minutes)],
    ['Faturamento por km', formatPerKm(summary.grossPerKm)],
    ['Lucro por hora', formatPerHour(summary.profitPerHour)],
  ].map(tableRow);
  const shiftRows = report.shifts.map((shift) =>
    tableRow([
      formatDate(shift.date),
      formatBRL(shift.grossCents),
      formatKm(shift.km),
      formatDuration(shift.minutes),
      formatBRL(computeShift(shift).profitCents),
    ]),
  );

  return `<html><head><meta charset="utf-8"><style>
    body { font-family: sans-serif; color: #171717; padding: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    td, th { border-bottom: 1px solid #E2E2E2; padding: 6px; text-align: left; font-size: 12px; }
    small { color: #5E5E5E; }
  </style></head><body>
    <h1>${escapeHtml(APP_NAME)}: relatório</h1>
    <p>${formatDate(report.start)} a ${formatDate(report.end)}</p>
    <h2>Resumo</h2><table>${summaryRows.join('')}</table>
    <h2>Jornadas</h2><table>
      <tr><th>Data</th><th>Faturamento</th><th>Distância</th><th>Tempo</th><th>Lucro</th></tr>
      ${shiftRows.join('')}
    </table>
    <small>Gerado com os dados informados pelo usuário. Valores estimados, sem valor fiscal.</small>
  </body></html>`;
}

export async function shareReportPdf(report: ReportData): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: buildReportHtml(report) });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}

export async function shareReportCsv(report: ReportData): Promise<void> {
  const header = ['Data', 'Faturamento', 'Km', 'Minutos', 'Despesas', 'Lucro', 'Custo por km'];
  const rows = report.shifts.map((shift) => [
    shift.date,
    centsToCsv(shift.grossCents),
    shift.km === null ? null : String(shift.km).replace('.', ','),
    shift.minutes,
    centsToCsv(shift.expensesCents),
    centsToCsv(computeShift(shift).profitCents),
    centsToCsv(shift.costPerKm),
  ]);
  await shareTextFile(`jornadas-${report.start}-a-${report.end}.csv`, toCsv(header, rows), 'text/csv');
}
