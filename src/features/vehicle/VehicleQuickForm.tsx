import { useTranslation } from 'react-i18next';
import { useFormat } from '@shared/i18n/format';
import { MoneyField, NumberField } from '@shared/ui/fields';
import { Card, Segmented } from '@shared/ui/primitives';
import { CostSummaryCard } from './CostSummaryCard';
import { useVehicleForm } from './useVehicleForm';
import { useVehicleOptions } from './useVehicleOptions';
import { consumptionLabel } from './vehicleForm';

type VehicleFormState = ReturnType<typeof useVehicleForm>;

export function VehicleQuickForm({ form }: { form: VehicleFormState }) {
  const { t } = useTranslation('vehicle');
  const format = useFormat();
  const { fuelOptions, kindOptions } = useVehicleOptions();
  return (
    <>
      <Card title={t('quickForm.title')}>
        <Segmented value={form.kind} options={kindOptions} onChange={form.setKind} />
        <Segmented value={form.fuel} options={fuelOptions} onChange={form.setFuel} />
        <NumberField label={t('form.consumption')} suffix={consumptionLabel(form.fuel, format)} {...form.bind('consumption')} />
        <MoneyField label={t('form.fuelPrice')} {...form.bind('fuelPrice')} />
        <NumberField label={t('form.plannedDistance', { context: format.distanceUnit })} suffix={format.distanceUnit} {...form.bind('plannedKm')} />
      </Card>
      <CostSummaryCard costs={form.costs} />
    </>
  );
}
