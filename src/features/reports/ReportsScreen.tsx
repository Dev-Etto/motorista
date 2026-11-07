import { useState } from 'react';
import { MIN_SHIFTS_FOR_INSIGHTS } from '@/domain/insights/buildInsights';
import { ReportPeriod } from '@/domain/report/report';
import { ProfitCard } from '@/features/dashboard';
import { InsightCard } from '@/features/insights';
import { TipBanner } from '@/features/tips';
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary';
import { BarChart } from '@/shared/ui/BarChart';
import { PeriodSwitcher } from '@/shared/ui/MonthSwitcher';
import { PlatformBadge } from '@/shared/ui/PlatformBadge';
import { Button, ButtonRow, Card, EmptyState, ListRow, Notice, Screen, Segmented } from '@/shared/ui/primitives';
import { today } from '@/shared/utils/dates';
import { formatPerKm, profitTone } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';
import { shareReportCsv, shareReportPdf } from './reportExport';
import { PERIOD_NOUNS, periodLabel, stepPeriod } from './reportPeriod';
import { useReport } from './useReport';

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
];

export default function ReportsScreen() {
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [date, setDate] = useState(today);
  const report = useReport(period, date);
  const [exportError, setExportError] = useState<string | null>(null);

  const runExport = async (action: () => Promise<void>) => {
    setExportError(null);
    try {
      await action();
    } catch {
      setExportError('Não foi possível gerar o arquivo.');
    }
  };

  return (
    <Screen>
      <TipBanner id="reports" message="Mês fechado desconta o custo fixo inteiro. É onde você vê se rodou o suficiente para pagar os custos." />
      <Segmented value={period} options={PERIODS} onChange={setPeriod} />
      <PeriodSwitcher
        label={periodLabel(period, date)}
        noun={PERIOD_NOUNS[period]}
        onPrevious={() => setDate(stepPeriod(period, date, -1))}
        onNext={() => setDate(stepPeriod(period, date, 1))}
      />
      <AsyncBoundary state={report}>
        {(data) => (
          <>
            {data.shifts.length === 0 ? (
              <EmptyState illustration="empty" title="Sem jornadas neste período" message="Registre jornadas para ver gráficos e relatórios." />
            ) : (
              <>
                <ProfitCard title="Lucro no período" summary={data.summary} />
                <Card title={period === 'year' ? 'Lucro por mês' : 'Lucro por dia'}>
                  <BarChart data={report.chart} accessibilityLabel={`Lucro no período: ${formatBRL(data.summary.profitCents)}`} />
                </Card>
                {data.monthClose ? (
                  <Card title="Mês fechado">
                    <ListRow title="Custo variável" value={formatBRL(data.monthClose.variableCents)} />
                    <ListRow title="Custo fixo do mês inteiro" value={formatBRL(data.monthClose.fixedCents)} />
                    <ListRow title="Despesas" value={formatBRL(data.monthClose.expensesCents)} />
                    <ListRow title="Custo real por km" value={formatPerKm(data.monthClose.realCostPerKm)} />
                    <ListRow
                      title="Lucro com o fixo inteiro"
                      value={formatBRL(data.monthClose.profitCents)}
                      valueTone={profitTone(data.monthClose.profitCents)}
                    />
                  </Card>
                ) : null}
                <Card title="Por plataforma">
                  {data.platforms.map((item) => (
                    <ListRow key={item.platform} leading={<PlatformBadge name={item.platform} />} title="" value={formatBRL(item.cents)} />
                  ))}
                </Card>
                <ButtonRow>
                  <Button label="Gerar PDF" onPress={() => runExport(() => shareReportPdf(data))} />
                  <Button label="Exportar CSV" variant="secondary" onPress={() => runExport(() => shareReportCsv(data))} />
                </ButtonRow>
                {exportError ? <Notice tone="negative" message={exportError} /> : null}
              </>
            )}
            {data.insights.length ? (
              data.insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
            ) : (
              <Notice tone="accent" message={`Os insights aparecem a partir de ${MIN_SHIFTS_FOR_INSIGHTS} jornadas.`} />
            )}
          </>
        )}
      </AsyncBoundary>
    </Screen>
  );
}
