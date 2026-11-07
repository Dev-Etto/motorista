import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { archiveVehicle, chooseCurrentVehicle } from '@application/vehicles';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { useSubmit } from '@shared/hooks/useSubmit';
import { confirmAction } from '@shared/ui/dialog';
import { Button, Notice, Screen } from '@shared/ui/primitives';
import { CostSummaryCard } from './CostSummaryCard';
import { useVehicleForm, VehicleTarget } from './useVehicleForm';
import { VehicleCostForm } from './VehicleCostForm';
import { loadVehicleStatus } from './vehicleStatus';

const targetOf = (id: string | undefined): VehicleTarget => {
  if (id === 'new') return 'new';
  return id ? Number(id) : 'current';
};

export default function VehicleScreen() {
  const router = useRouter();
  const { t } = useTranslation(['vehicle', 'common']);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const form = useVehicleForm(targetOf(id));
  const { data: status } = useAsyncData(() => loadVehicleStatus(form.vehicleId), [form.vehicleId]);

  const saving = useSubmit(async () => {
    if (await form.save()) router.back();
  });

  const useNow = useSubmit(async () => {
    if (!form.vehicleId) return;
    await chooseCurrentVehicle(form.vehicleId);
    router.back();
  });

  const archive = () => {
    const vehicleId = form.vehicleId;
    if (!vehicleId) return;

    confirmAction({
      title: t('manage.archiveConfirm.title', { name: form.name }),
      message: t('manage.archiveConfirm.message'),
      actionLabel: t('manage.archive'),
      onConfirm: async () => {
        await archiveVehicle(vehicleId);
        router.back();
      },
    });
  };

  return (
    <Screen>
      <VehicleCostForm form={form} />
      <CostSummaryCard costs={form.costs} detailed />
      {form.error ? <Notice tone="negative" message={form.error} /> : null}
      {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
      <Button label={t('common:actions.save')} busy={saving.busy} onPress={saving.submit} />
      {status?.canUseNow ? <Button label={t('manage.useNow')} variant="secondary" busy={useNow.busy} onPress={useNow.submit} /> : null}
      {status?.canArchive ? <Button label={t('manage.archive')} variant="danger" onPress={archive} /> : null}
    </Screen>
  );
}
