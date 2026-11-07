import { Insight } from '@/domain/insights/types';
import { AppText, Card } from '@/shared/ui/primitives';

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <Card>
      <AppText variant="caption" tone="accent" bold>
        {insight.title}
      </AppText>
      <AppText>{insight.message}</AppText>
      <AppText variant="caption" tone="muted">
        {insight.basis}
      </AppText>
    </Card>
  );
}
