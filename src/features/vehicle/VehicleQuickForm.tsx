import { MoneyField, NumberField } from '@/shared/ui/fields';
import { Card, Segmented } from '@/shared/ui/primitives';
import { CostSummaryCard } from './CostSummaryCard';
import { useVehicleForm } from './useVehicleForm';
import { CONSUMPTION_UNITS, FUEL_OPTIONS, KIND_OPTIONS } from './vehicleForm';

type VehicleFormState = ReturnType<typeof useVehicleForm>;

export function VehicleQuickForm({ form }: { form: VehicleFormState }) {
  return (
    <>
      <Card title="O básico">
        <Segmented value={form.kind} options={KIND_OPTIONS} onChange={form.setKind} />
        <Segmented value={form.fuel} options={FUEL_OPTIONS} onChange={form.setFuel} />
        <NumberField label="Consumo" suffix={CONSUMPTION_UNITS[form.fuel]} {...form.bind('consumption')} />
        <MoneyField label="Preço do combustível" {...form.bind('fuelPrice')} />
        <NumberField label="Km previstos por mês" suffix="km" {...form.bind('plannedKm')} />
      </Card>
      <CostSummaryCard costs={form.costs} />
    </>
  );
}
