import { useTranslation } from 'react-i18next';
import { ShiftResult } from '@domain/shift/shift';
import { useFormat } from '@shared/i18n/format';
import { AppText, Card, ListRow, Notice } from '@shared/ui/primitives';
import { profitTone } from '@shared/utils/format';

export function ShiftResultCard({ result }: { result: ShiftResult }) {
  const { t } = useTranslation('shifts');
  const format = useFormat();
  return (
    <Card title={t('result.title')}>
      <AppText variant="title" bold tone={profitTone(result.profitCents)}>
        {format.money(result.profitCents)}
      </AppText>
      {result.partial ? <Notice message={t('result.partial', { context: format.distanceUnit })} /> : null}
      <ListRow title={t('result.gross')} value={format.money(result.grossCents)} />
      <ListRow title={t('result.vehicleCost')} value={format.money(result.vehicleCostCents)} />
      <ListRow title={t('result.expenses')} value={format.money(result.expensesCents)} />
      <ListRow title={t('result.grossPerKm', { context: format.distanceUnit })} value={format.perDistance(result.grossPerKm)} />
      <ListRow title={t('result.grossPerHour')} value={format.perHour(result.grossPerHour)} />
      <ListRow title={t('result.profitPerHour')} value={format.perHour(result.profitPerHour)} />
    </Card>
  );
}
