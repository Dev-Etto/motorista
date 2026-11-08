import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { MIN_SHIFTS_FOR_INSIGHTS } from '@domain/insights/buildInsights';
import { ReportPeriod } from '@domain/report/report';
import { InsightCard } from '@features/insights';
import { TipBanner } from '@features/tips';
import { useFormat } from '@shared/i18n/format';
import { spacing } from '@shared/theme/theme';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { BarChart } from '@shared/ui/BarChart';
import { PeriodSwitcher } from '@shared/ui/MonthSwitcher';
import { PlatformBadge } from '@shared/ui/PlatformBadge';
import { AppText, Button, ButtonRow, Card, Collapsible, EmptyState, ListRow, Notice, Segmented } from '@shared/ui/primitives';
import { today } from '@shared/utils/dates';
import { profitTone } from '@shared/utils/format';
import { reportError } from '@shared/utils/reportError';
import { ChartDataList } from './ChartDataList';
import { platformShare } from './platformShare';
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
    } catch (error) {
      reportError(error);
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
                <Card>
                  <View style={styles.heroHeader}>
                    <AppText bold tone="muted" accessibilityRole="header" style={styles.flex}>
                      {t('summary.profitIn', { context: period })}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {t('summary.shifts', { count: data.summary.count })}
                    </AppText>
                  </View>
                  <AppText variant="display" bold tone={profitTone(data.summary.profitCents)}>
                    {format.money(data.summary.profitCents)}
                  </AppText>
                  <BarChart data={report.chart} accessibilityLabel={t('chart.accessibilityLabel', { amount: format.money(data.summary.profitCents) })} />
                  <ChartDataList data={report.chart} period={period} />
                </Card>
                <Card title={t('byPlatform')}>
                  {data.platforms.map((item) => {
                    const share = platformShare(item.cents, data.platforms);
                    return (
                      <ListRow
                        key={item.platform}
                        leading={<PlatformBadge name={item.platform} />}
                        value={format.money(item.cents)}
                        subtitle={format.percent(share)}
                        accessibilityLabel={`${item.platform}, ${format.money(item.cents)}, ${format.percent(share)}`}
                      />
                    );
                  })}
                </Card>
                <Collapsible title={data.monthClose ? t('summary.closeAndExport') : t('summary.export')}>
                  {data.monthClose ? (
                    <>
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
                    </>
                  ) : null}
                  <ButtonRow>
                    <Button label={t('pdfButton')} onPress={() => runExport(() => shareReportPdf(data, format, t))} />
                    <Button label={t('csvButton')} variant="secondary" onPress={() => runExport(() => shareReportCsv(data, format, t))} />
                  </ButtonRow>
                </Collapsible>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
