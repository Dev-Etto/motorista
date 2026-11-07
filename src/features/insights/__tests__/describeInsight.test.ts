import { Insight } from '@domain/insights/types';
import { describeInsight } from '@features/insights/describeInsight';
import { i18n } from '@shared/i18n';
import { createFormatter, currentFormat, DEFAULT_FORMAT } from '@shared/i18n/format';

const describe_ = (insight: Insight) => describeInsight(insight, i18n.getFixedT('pt-BR', 'insights'), currentFormat());

describe('texto dos insights em português', () => {
  it.each<[Insight, string, string, string]>([
    [
      { id: 'real-profit', grossCents: 20000, profitCents: 10000, shifts: 5, sharePerHundred: 50 },
      'Lucro real',
      'De cada R$ 100 faturados, R$ 50 ficaram com você.',
      'Faturamento R$ 200,00 e lucro R$ 100,00 em 5 jornadas.',
    ],
    [
      { id: 'real-profit', grossCents: 20000, profitCents: -2000, shifts: 1, sharePerHundred: -10 },
      'Lucro real',
      'Para cada R$ 100 faturados, faltaram R$ 10 para cobrir os custos.',
      'Faturamento R$ 200,00 e lucro -R$ 20,00 em 1 jornada.',
    ],
    [
      { id: 'best-weekday', weekday: 1, perHourCents: 3550, shifts: 2 },
      'Melhor dia',
      'Segunda rendeu o maior lucro por hora nas últimas 4 semanas.',
      'R$ 35,50/h em 2 jornadas.',
    ],
    [
      { id: 'best-period', best: 'morning', worst: 'night', gapCents: 500, bestPerHourCents: 3000, worstPerHourCents: 2500 },
      'Melhor período',
      'Jornadas iniciadas de manhã rendem R$ 5,00/h a mais do que as de noite.',
      'manhã: R$ 30,00/h. noite: R$ 25,00/h.',
    ],
    [
      { id: 'platform', platform: 'Uber', sharePct: 60, cents: 60000, grossCents: 100000 },
      'Plataforma',
      'Uber trouxe 60% do seu faturamento.',
      'R$ 600,00 de R$ 1.000,00.',
    ],
    [
      { id: 'biggest-cost', part: 'fuel', sharePct: 70, perKmCents: 54.5, fullPerKmCents: 78 },
      'Maior custo',
      'Combustível é 70% do seu custo por km.',
      'R$ 0,55/km de R$ 0,78/km.',
    ],
    [
      { id: 'efficiency', previousPerHourCents: 3000, lastPerHourCents: 2500 },
      'Eficiência',
      'Seu lucro subiu, mas o lucro por hora caiu: você trabalhou mais para chegar lá.',
      'Por hora: R$ 30,00 para R$ 25,00 nos últimos 7 dias.',
    ],
    [
      { id: 'break-even', dailyCents: 12345, daysPerMonth: 22, kmPerDay: 150.4 },
      'Ponto de equilíbrio',
      'Você precisa faturar R$ 123,45 por dia só para cobrir os custos.',
      '22 dias por mês e 150 km por dia, em média.',
    ],
    [
      { id: 'projection', projectedCents: 450000, profitCents: 150000, dayOfMonth: 10 },
      'Projeção do mês',
      'Nesse ritmo, você fecha o mês com R$ 4.500,00 de lucro.',
      'R$ 1.500,00 em 10 dias do mês.',
    ],
    [
      { id: 'fuel-gap', gapPct: 12, expectedCents: 50000, paidCents: 56000 },
      'Combustível',
      'Você gastou 12% a mais do que o previsto. Vale revisar o consumo.',
      'Previsto R$ 500,00 e pago R$ 560,00.',
    ],
    [
      { id: 'fuel-gap', gapPct: -15, expectedCents: 50000, paidCents: 42500 },
      'Combustível',
      'Você gastou 15% a menos do que o previsto. Vale revisar o consumo.',
      'Previsto R$ 500,00 e pago R$ 425,00.',
    ],
    [
      { id: 'fixed-weight', extraKm: 1000, savingPerKmCents: 4, fixedMonthlyCents: 100000, plannedKm: 4000 },
      'Peso do custo fixo',
      'Rodando 1.000 km a mais por mês, seu custo cairia R$ 0,04/km.',
      'Fixos de R$ 1.000,00/mês em 4.000 km previstos.',
    ],
  ])('%o', (insight, title, message, basis) => {
    expect(describe_(insight)).toEqual({ title, message, basis });
  });
});

describe('texto dos insights em inglês, dólar e milha', () => {
  const format = createFormatter({ ...DEFAULT_FORMAT, locale: 'en-US', currency: 'USD', distanceUnit: 'mi' });
  const t = i18n.getFixedT('en', 'insights');

  it('usa milha, dólar e o idioma do perfil', () => {
    const text = describeInsight({ id: 'biggest-cost', part: 'fuel', sharePct: 70, perKmCents: 50, fullPerKmCents: 100 }, t, format);
    expect(text.message).toContain('per mile');
    expect(text.basis).toBe('$0.80/mi out of $1.61/mi.');
  });

  it('formata o lucro real em dólar', () => {
    const text = describeInsight({ id: 'real-profit', grossCents: 20000, profitCents: 10000, shifts: 5, sharePerHundred: 50 }, t, format);
    expect(text.message).toContain('$100');
    expect(text.message).toContain('$50');
    expect(text.basis).toContain('$200.00');
  });
});
