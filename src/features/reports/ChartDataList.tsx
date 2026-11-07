import { useTranslation } from 'react-i18next';
import type { ReportPeriod } from '@domain/report/report';
import { useFormat } from '@shared/i18n/format';
import type { BarDatum } from '@shared/ui/BarChart';
import { LearnMore } from '@shared/ui/LearnMore';
import { ListRow } from '@shared/ui/primitives';
import { profitTone } from '@shared/utils/format';

export function ChartDataList({ data, period }: { data: BarDatum[]; period: ReportPeriod }) {
  const { t } = useTranslation('reports');
  const format = useFormat();
  if (data.length === 0) return null;

  return (
    <LearnMore title={t('chart.showData')}>
      {data.map((datum, index) => (
        <ListRow
          key={`${datum.label}-${index}`}
          title={period === 'year' ? datum.label : t('chart.dayRow', { day: datum.label })}
          value={format.money(datum.value)}
          valueTone={profitTone(datum.value)}
        />
      ))}
    </LearnMore>
  );
}
