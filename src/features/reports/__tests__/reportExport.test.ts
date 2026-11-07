import { buildReportCsv } from '@features/reports/reportExport';
import { i18n } from '@shared/i18n';
import { createFormatter, DEFAULT_FORMAT } from '@shared/i18n/format';

jest.mock('expo-print', () => ({}));
jest.mock('expo-sharing', () => ({}));

const shift = {
  id: 1,
  date: '2026-11-05',
  startHour: 8,
  minutes: 480,
  km: 160.9344,
  grossCents: 30050,
  expensesCents: 1500,
  costPerKm: 100,
  earnings: [],
  partial: false,
};

const t = i18n.getFixedT('pt-BR', 'reports');
const lines = (csv: string) => csv.replace('﻿', '').split('\r\n');

describe('CSV do relatório', () => {
  it('em português usa ponto e vírgula, vírgula decimal, real e km', () => {
    const [header, row] = lines(buildReportCsv({ shifts: [shift] } as never, createFormatter(DEFAULT_FORMAT), t));
    expect(header).toBe('Data;Faturamento (BRL);Km;Minutos;Despesas (BRL);Lucro (BRL);Custo por km (BRL)');
    expect(row).toBe('2026-11-05;300,50;160,93;480;15,00;124,57;1,00');
  });

  it('em inglês com milha usa vírgula entre colunas e converte distância e custo', () => {
    const format = createFormatter({ ...DEFAULT_FORMAT, locale: 'en-US', currency: 'USD', distanceUnit: 'mi' });
    const [header, row] = lines(buildReportCsv({ shifts: [shift] } as never, format, t));
    expect(header).toBe('Data,Faturamento (USD),Milhas,Minutos,Despesas (USD),Lucro (USD),Custo por milha (USD)');
    expect(row).toBe('2026-11-05,300.50,100,480,15.00,124.57,1.61');
  });
});
