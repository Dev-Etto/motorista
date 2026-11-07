import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSubmit } from '@shared/hooks/useSubmit';
import { Button, Notice, Screen } from '@shared/ui/primitives';
import { CostSummaryCard } from './CostSummaryCard';
import { useVehicleForm } from './useVehicleForm';
import { VehicleCostForm } from './VehicleCostForm';

export default function VehicleScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const form = useVehicleForm();

  const saving = useSubmit(async () => {
    if (await form.save()) router.back();
  });

  return (
    <Screen>
      <VehicleCostForm form={form} />
      <CostSummaryCard costs={form.costs} detailed />
      {form.error ? <Notice tone="negative" message={form.error} /> : null}
      {saving.error ? <Notice tone="negative" message={saving.error} /> : null}
      <Button label={t('actions.save')} busy={saving.busy} onPress={saving.submit} />
    </Screen>
  );
}
