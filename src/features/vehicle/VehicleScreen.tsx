import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { archiveVehicle, chooseCurrentVehicle, shiftVehicleOtherThan } from '@application/vehicles';
import { useAsyncData } from '@shared/hooks/useAsyncData';
import { useSubmit } from '@shared/hooks/useSubmit';
import { confirmAction, showDialog } from '@shared/ui/dialog';
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

  const switchTo = async (vehicleId: number) => {
    await chooseCurrentVehicle(vehicleId);
    router.back();
  };

  const useNow = useSubmit(async () => {
    const vehicleId = form.vehicleId;
    if (!vehicleId) return;

    const inShift = await shiftVehicleOtherThan(vehicleId);
    if (!inShift) return switchTo(vehicleId);

    showDialog({
      title: t('manage.switchInShift.title'),
      message: t('manage.switchInShift.message', { shift: inShift.name, next: form.name }),
      actions: [
        { label: t('common:actions.cancel'), tone: 'secondary' },
        { label: t('manage.switchInShift.action'), tone: 'primary', onPress: () => switchTo(vehicleId) },
      ],
    });
  });

  const archive = () => {
    const vehicleId = form.vehicleId;
    if (!vehicleId) return;

    confirmAction({
      title: t('manage.archiveConfirm.title', { name: form.name }),
      message: status?.nextCurrent
        ? `${t('manage.archiveConfirm.message')} ${t('manage.archiveConfirm.nextCurrent', { name: status.nextCurrent.name })}`
        : t('manage.archiveConfirm.message'),
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
      <Notice tone="accent" message={t('manage.validFromToday')} />
      {form.error ? <Notice tone="negative" message={form.error} /> : null}
      {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
      <Button label={t('common:actions.save')} busy={saving.busy} onPress={saving.submit} />
      {status?.canUseNow ? <Button label={t('manage.useNow')} variant="secondary" busy={useNow.busy} onPress={useNow.submit} /> : null}
      {status?.inShift ? <Notice tone="accent" message={t('manage.inShift')} /> : null}
      {status?.canArchive ? <Button label={t('manage.archive')} variant="danger" onPress={archive} /> : null}
    </Screen>
  );
}
