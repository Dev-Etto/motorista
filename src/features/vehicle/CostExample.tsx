import { useTranslation } from 'react-i18next';
import { useFormat } from '@shared/i18n/format';
import { AppText, Card, ListRow } from '@shared/ui/primitives';
import { profitTone } from '@shared/utils/format';
import { distanceToKm } from '@shared/utils/units';

const EXAMPLE_VALUE_CENTS = 2000;
const EXAMPLE_DISTANCE = 10;

export function CostExample({ costPerKm }: { costPerKm: number }) {
  const { t } = useTranslation('vehicle');
  const format = useFormat();
  const exampleKm = distanceToKm(EXAMPLE_DISTANCE, format.distanceUnit);
  const costCents = costPerKm * exampleKm;

  return (
    <Card title={t('costExample.title')}>
      <AppText tone="muted">{t('costExample.intro', { value: format.money(EXAMPLE_VALUE_CENTS), distance: format.distance(exampleKm, 0) })}</AppText>
      <ListRow title={t('costExample.received')} value={format.money(EXAMPLE_VALUE_CENTS)} />
      <ListRow title={t('costExample.vehicle')} subtitle={t('costExample.vehicleDetail')} value={`- ${format.money(costCents)}`} />
      <ListRow title={t('costExample.left')} value={format.money(EXAMPLE_VALUE_CENTS - costCents)} valueTone={profitTone(EXAMPLE_VALUE_CENTS - costCents)} />
    </Card>
  );
}
