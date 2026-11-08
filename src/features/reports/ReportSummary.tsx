import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MIN_SHIFTS_FOR_INSIGHTS } from '@domain/insights/buildInsights';
import { ReportPeriod } from '@domain/report/report';
import { ProfitCard } from '@features/dashboard';
import { InsightCard } from '@features/insights';
import { TipBanner } from '@features/tips';
import { useFormat } from '@shared/i18n/format';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { BarChart } from '@shared/ui/BarChart';
import { PeriodSwitcher } from '@shared/ui/MonthSwitcher';
import { PlatformBadge } from '@shared/ui/PlatformBadge';
import { Button, ButtonRow, Card, EmptyState, ListRow, Notice, Segmented } from '@shared/ui/primitives';
import { today } from '@shared/utils/dates';
import { profitTone } from '@shared/utils/format';
import { ChartDataList } from './ChartDataList';
import { shareReportCsv, shareReportPdf } from './reportExport';
import { periodLabel, periodNoun, startsAfter, stepPeriod } from './reportPeriod';
import { useReport } from './useReport';

const PERIODS: ReportPeriod[] = ['week', 'month', 'year'];

export function ReportSummary() {
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [date, setDate] = useState(today);
  const report = useReport(period, date);
  const format = useFormat();
  const { t } = useTranslation('reports');
  const periods = PERIODS.map((value) => ({ value, label: periodNoun(value, t) }));
  const [exportError, setExportError] = useState<string | null>(null);

  const runExport = async (action: () => Promise<void>) => {
    setExportError(null);
    try {
      await action();
    } catch {
      setExportError(t('exportFailed'));
    }
  };

  return (
    <>
      <TipBanner id="reports" message={t('tip')} />
      <Segmented value={period} options={periods} onChange={setPeriod} />
      <PeriodSwitcher
        label={periodLabel(period, date, format, t)}
        period={period}
        onPrevious={() => setDate(stepPeriod(period, date, -1))}
        onNext={() => setDate(stepPeriod(period, date, 1))}
        nextDisabled={startsAfter(period, date, format.profile.firstWeekday, today())}
      />
      <AsyncBoundary state={report}>
        {(data) => (
          <>
            {data.shifts.length === 0 ? (
              <EmptyState icon="reports" title={t('emptyTitle')} message={t('emptyMessage')} />
            ) : (
              <>
                <ProfitCard title={t('periodProfit')} summary={data.summary} />
                <Card title={period === 'year' ? t('chart.byMonth') : t('chart.byDay')}>
                  <BarChart data={report.chart} accessibilityLabel={t('chart.accessibilityLabel', { amount: format.money(data.summary.profitCents) })} />
                  <ChartDataList data={report.chart} period={period} />
                </Card>
                {data.monthClose ? (
                  <Card title={t('monthClose.title')}>
                    <ListRow title={t('monthClose.variable')} value={format.money(data.monthClose.variableCents)} />
                    <ListRow title={t('monthClose.fixed')} value={format.money(data.monthClose.fixedCents)} />
                    <ListRow title={t('monthClose.expenses')} value={format.money(data.monthClose.expensesCents)} />
                    <ListRow
                      title={t('monthClose.realCostPerKm', { context: format.distanceUnit })}
                      value={format.perDistance(data.monthClose.realCostPerKm)}
                    />
                    <ListRow
                      title={t('monthClose.profit')}
                      value={format.money(data.monthClose.profitCents)}
                      valueTone={profitTone(data.monthClose.profitCents)}
                    />
                  </Card>
                ) : null}
                <Card title={t('byPlatform')}>
                  {data.platforms.map((item) => (
                    <ListRow
                      key={item.platform}
                      leading={<PlatformBadge name={item.platform} />}
                      value={format.money(item.cents)}
                      accessibilityLabel={`${item.platform}, ${format.money(item.cents)}`}
                    />
                  ))}
                </Card>
                <ButtonRow>
                  <Button label={t('pdfButton')} onPress={() => runExport(() => shareReportPdf(data, format, t))} />
                  <Button label={t('csvButton')} variant="secondary" onPress={() => runExport(() => shareReportCsv(data, format, t))} />
                </ButtonRow>
                {exportError ? <Notice tone="negative" message={exportError} /> : null}
              </>
            )}
            {data.insights.length ? (
              data.insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
            ) : (
              <Notice tone="accent" message={t('insightsFrom', { minimum: MIN_SHIFTS_FOR_INSIGHTS })} />
            )}
          </>
        )}
      </AsyncBoundary>
    </>
  );
}
