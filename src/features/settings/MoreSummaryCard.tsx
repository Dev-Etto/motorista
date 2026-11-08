import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@shared/i18n/format';
import { Card, ListRow } from '@shared/ui/primitives';
import { useMoreSummary } from './useMoreSummary';

const PERCENT = 100;

export function MoreSummaryCard() {
  const router = useRouter();
  const format = useFormat();
  const { t } = useTranslation('settings');
  const { data } = useMoreSummary();
  if (!data || (!data.vehicle && !data.goal)) return null;

  return (
    <Card>
      {data.vehicle ? (
        <ListRow
          icon={data.vehicle.kind === 'motorcycle' ? 'motorcycle' : 'vehicle'}
          title={data.vehicle.name}
          subtitle={t('more.summary.vehicle')}
          value={data.costPerKm === null ? undefined : format.perDistance(data.costPerKm)}
          onPress={() => router.push('/vehicles')}
        />
      ) : null}
      {data.goal ? (
        <ListRow
          icon="goal"
          title={t('more.summary.goal', { month: format.month(`${data.goal.goal.month}-01`) })}
          subtitle={format.money(data.goal.goal.desiredProfitCents)}
          value={t('more.summary.goalDone', { percent: Math.round(data.goal.progress * PERCENT) })}
          onPress={() => router.push('/goal')}
        />
      ) : null}
    </Card>
  );
}
