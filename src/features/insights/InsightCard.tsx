import { useTranslation } from 'react-i18next';
import { Insight } from '@domain/insights/types';
import { useFormat } from '@shared/i18n/format';
import { AppText, Card } from '@shared/ui/primitives';
import { describeInsight } from './describeInsight';

export function InsightCard({ insight }: { insight: Insight }) {
  const { t } = useTranslation('insights');
  const format = useFormat();
  const text = describeInsight(insight, t, format);

  return (
    <Card>
      <AppText variant="caption" tone="accent" bold>
        {text.title}
      </AppText>
      <AppText>{text.message}</AppText>
      <AppText variant="caption" tone="muted">
        {text.basis}
      </AppText>
    </Card>
  );
}
