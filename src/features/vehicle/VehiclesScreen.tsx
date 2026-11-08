import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { reactivateVehicle } from '@application/vehicles';
import { useFormat } from '@shared/i18n/format';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { confirmAction } from '@shared/ui/dialog';
import { AppText, Button, Card, EmptyState, ListRow, Screen } from '@shared/ui/primitives';
import { useVehicles } from './useVehicles';

export default function VehiclesScreen() {
  const router = useRouter();
  const { t } = useTranslation('vehicle');
  const format = useFormat();
  const vehicles = useVehicles();

  const confirmReactivate = (id: number, name: string) => {
    confirmAction({
      title: t('manage.reactivateConfirm.title', { name }),
      message: t('manage.reactivateConfirm.message'),
      actionLabel: t('manage.reactivate'),
      onConfirm: async () => {
        await reactivateVehicle(id);
        await vehicles.reload();
      },
    });
  };

  return (
    <Screen>
      <AppText tone="muted">{t('manage.intro')}</AppText>
      <AsyncBoundary state={vehicles}>
        {({ active, archived }) => (
          <>
            {active.length === 0 ? (
              <EmptyState title={t('manage.emptyTitle')} message={t('manage.emptyMessage')} />
            ) : (
              <Card>
                {active.map(({ vehicle, costs, current }) => (
                  <ListRow
                    key={vehicle.id}
                    icon={vehicle.kind === 'motorcycle' ? 'motorcycle' : 'vehicle'}
                    title={vehicle.name}
                    subtitle={[t(`fuel.${vehicle.fuel}`), costs ? format.perDistance(costs.fullPerKm) : null].filter(Boolean).join(' · ')}
                    value={current ? t('manage.currentBadge') : undefined}
                    valueTone="positive"
                    chevron
                    onPress={() => router.push({ pathname: '/vehicle', params: { id: String(vehicle.id) } })}
                  />
                ))}
              </Card>
            )}
            {archived.length > 0 ? (
              <Card title={t('manage.archivedTitle')}>
                {archived.map((vehicle) => (
                  <ListRow
                    key={vehicle.id}
                    icon={vehicle.kind === 'motorcycle' ? 'motorcycle' : 'vehicle'}
                    title={vehicle.name}
                    subtitle={t('manage.reactivateHint')}
                    onPress={() => confirmReactivate(vehicle.id, vehicle.name)}
                  />
                ))}
              </Card>
            ) : null}
          </>
        )}
      </AsyncBoundary>
      <Button label={t('manage.add')} onPress={() => router.push({ pathname: '/vehicle', params: { id: 'new' } })} />
    </Screen>
  );
}
