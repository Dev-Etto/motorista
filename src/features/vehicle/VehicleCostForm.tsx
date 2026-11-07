import { useTranslation } from 'react-i18next';
import { useFormat } from '@shared/i18n/format';
import { MoneyField, NumberField, TextField } from '@shared/ui/fields';
import { AppText, Card, Collapsible, Notice, Segmented, ToggleRow } from '@shared/ui/primitives';
import { CostSummaryCard } from './CostSummaryCard';
import { useVehicleForm } from './useVehicleForm';
import { useVehicleOptions } from './useVehicleOptions';
import { consumptionLabel, CONSUMPTION_HINT_KEYS } from './vehicleForm';

type VehicleFormState = ReturnType<typeof useVehicleForm>;

export function VehicleCostForm({ form }: { form: VehicleFormState }) {
  const { t } = useTranslation('vehicle');
  const format = useFormat();
  const { fuelOptions, kindOptions, ownershipOptions } = useVehicleOptions();
  const { bind, ownership } = form;

  return (
    <>
      <CostSummaryCard costs={form.costs} />
      <Notice tone="accent" message={t('form.estimateNotice')} />

      <Card title={t('form.vehicleTitle')}>
        <TextField label={t('form.name')} value={form.name} onChangeText={form.setName} />
        <AppText variant="caption" tone="muted">
          {t('form.kind')}
        </AppText>
        <Segmented value={form.kind} options={kindOptions} onChange={form.setKind} />
        <AppText variant="caption" tone="muted">
          {t('form.fuel')}
        </AppText>
        <Segmented value={form.fuel} options={fuelOptions} onChange={form.setFuel} />
        <AppText variant="caption" tone="muted">
          {t('form.ownership')}
        </AppText>
        <Segmented value={ownership} options={ownershipOptions} onChange={form.setOwnership} />
      </Card>

      <Card title={t('form.usageTitle')}>
        <NumberField
          label={t('form.plannedDistance', { context: format.distanceUnit })}
          suffix={format.distanceUnit}
          hint={t('form.plannedDistanceHint')}
          {...bind('plannedKm')}
        />
        <MoneyField label={t('form.fuelPrice')} {...bind('fuelPrice')} />
        <NumberField
          label={t('form.consumption')}
          suffix={consumptionLabel(form.fuel, format)}
          hint={t(CONSUMPTION_HINT_KEYS[format.consumptionUnit])}
          {...bind('consumption')}
        />
      </Card>

      <Collapsible title={t('form.wearTitle')}>
        <MoneyField label={t('form.oilChange')} {...bind('oilChange')} />
        <NumberField label={t('form.oilInterval')} suffix={format.distanceUnit} {...bind('oilInterval')} />
        <MoneyField label={t('form.tires')} {...bind('tires')} />
        <NumberField label={t('form.tiresLife')} suffix={format.distanceUnit} {...bind('tiresLife')} />
        <MoneyField label={t('form.maintenance')} {...bind('maintenance')} />
      </Collapsible>

      <Collapsible title={t('form.fixedTitle')}>
        <MoneyField label={t('form.insurance')} {...bind('insurance')} />
        <MoneyField label={t('form.ipva')} {...bind('ipva')} />
        <MoneyField label={t('form.licensing')} {...bind('licensing')} />
        {ownership === 'owned' ? null : <MoneyField label={ownership === 'rented' ? t('form.rent') : t('form.installment')} {...bind('payment')} />}
        <MoneyField label={t('form.otherFixed')} {...bind('otherFixed')} />
      </Collapsible>

      {ownership === 'rented' ? null : (
        <Collapsible title={t('form.depreciationTitle')}>
          <ToggleRow
            label={t('form.depreciationToggle')}
            hint={ownership === 'financed' ? t('form.depreciationHintFinanced') : t('form.depreciationHint')}
            value={form.depreciationEnabled}
            onChange={form.setDepreciationEnabled}
          />
          {form.depreciationEnabled ? (
            <>
              <MoneyField label={t('form.vehicleValue')} {...bind('vehicleValue')} />
              <NumberField label={t('form.depreciationPerYear')} suffix="%" decimals={1} {...bind('depreciationPct')} />
            </>
          ) : null}
        </Collapsible>
      )}
    </>
  );
}
