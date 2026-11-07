import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@shared/i18n/format';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { AppText, Button, Card, EmptyState, ListRow, Screen } from '@shared/ui/primitives';
import { useVehicles } from './useVehicles';

export default function VehiclesScreen() {
  const router = useRouter();
  const { t } = useTranslation('vehicle');
  const format = useFormat();
  const vehicles = useVehicles();

  return (
    <Screen>
      <AppText tone="muted">{t('manage.intro')}</AppText>
      <AsyncBoundary state={vehicles}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState title={t('manage.emptyTitle')} message={t('manage.emptyMessage')} />
          ) : (
            <Card>
              {list.map(({ vehicle, costs, current }) => (
                <ListRow
                  key={vehicle.id}
                  icon={vehicle.kind === 'motorcycle' ? 'motorcycle' : 'vehicle'}
                  title={current ? t('manage.currentName', { name: vehicle.name }) : vehicle.name}
                  subtitle={t(`kind.${vehicle.kind}`)}
                  value={costs ? format.perDistance(costs.fullPerKm) : undefined}
                  onPress={() => router.push({ pathname: '/vehicle', params: { id: String(vehicle.id) } })}
                />
              ))}
            </Card>
          )
        }
      </AsyncBoundary>
      <Button label={t('manage.add')} onPress={() => router.push({ pathname: '/vehicle', params: { id: 'new' } })} />
    </Screen>
  );
}
