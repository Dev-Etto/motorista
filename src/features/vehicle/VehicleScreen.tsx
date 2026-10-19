import { useRouter } from 'expo-router';
import { Button, Screen } from '@/shared/ui/primitives';
import { CostSummaryCard } from './CostSummaryCard';
import { useVehicleForm } from './useVehicleForm';
import { VehicleCostForm } from './VehicleCostForm';

export default function VehicleScreen() {
  const router = useRouter();
  const form = useVehicleForm();

  const handleSave = async () => {
    await form.save();
    router.back();
  };

  return (
    <Screen>
      <VehicleCostForm form={form} />
      <CostSummaryCard costs={form.costs} detailed />
      <Button label="Salvar" onPress={handleSave} />
    </Screen>
  );
}
