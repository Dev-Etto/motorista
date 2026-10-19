import { Card, Notice, Segmented, ToggleRow } from '@/shared/ui/primitives';
import { MoneyField, NumberField, TextField } from '@/shared/ui/fields';
import { CostSummaryCard } from './CostSummaryCard';
import { useVehicleForm } from './useVehicleForm';
import { CONSUMPTION_UNITS, FUEL_OPTIONS, KIND_OPTIONS, OWNERSHIP_OPTIONS } from './vehicleForm';

type VehicleFormState = ReturnType<typeof useVehicleForm>;

export function VehicleCostForm({ form }: { form: VehicleFormState }) {
  const { bind, ownership } = form;

  return (
    <>
      <CostSummaryCard costs={form.costs} />
      <Notice tone="accent" message="Os valores sugeridos são estimativas. Troque pelos seus para ter um resultado real." />

      <Card title="Veículo">
        <TextField label="Nome" value={form.name} onChangeText={form.setName} />
        <Segmented value={form.kind} options={KIND_OPTIONS} onChange={form.setKind} />
        <Segmented value={form.fuel} options={FUEL_OPTIONS} onChange={form.setFuel} />
        <Segmented value={ownership} options={OWNERSHIP_OPTIONS} onChange={form.setOwnership} />
      </Card>

      <Card title="Uso e combustível">
        <NumberField label="Km previstos por mês" suffix="km" {...bind('plannedKm')} />
        <MoneyField label="Preço do combustível" {...bind('fuelPrice')} />
        <NumberField label="Consumo" suffix={CONSUMPTION_UNITS[form.fuel]} {...bind('consumption')} />
      </Card>

      <Card title="Desgaste">
        <MoneyField label="Troca de óleo" {...bind('oilChange')} />
        <NumberField label="Intervalo da troca" suffix="km" {...bind('oilInterval')} />
        <MoneyField label="Jogo de pneus" {...bind('tires')} />
        <NumberField label="Vida útil dos pneus" suffix="km" {...bind('tiresLife')} />
        <MoneyField label="Manutenção por mês" {...bind('maintenance')} />
      </Card>

      <Card title="Custos fixos">
        <MoneyField label="Seguro por mês" {...bind('insurance')} />
        <MoneyField label="IPVA por ano" {...bind('ipva')} />
        <MoneyField label="Licenciamento por ano" {...bind('licensing')} />
        {ownership === 'owned' ? null : (
          <MoneyField label={ownership === 'rented' ? 'Aluguel por mês' : 'Parcela por mês'} {...bind('payment')} />
        )}
        <MoneyField label="Outros custos fixos por mês" {...bind('otherFixed')} />
      </Card>

      {ownership === 'rented' ? null : (
        <Card title="Depreciação">
          <ToggleRow
            label="Considerar a depreciação"
            hint={ownership === 'financed' ? 'Desligada por padrão, para não somar com a parcela.' : 'O quanto o veículo perde de valor com o tempo.'}
            value={form.depreciationEnabled}
            onChange={form.setDepreciationEnabled}
          />
          {form.depreciationEnabled ? (
            <>
              <MoneyField label="Valor do veículo" {...bind('vehicleValue')} />
              <NumberField label="Depreciação por ano" suffix="%" {...bind('depreciationPct')} />
            </>
          ) : null}
        </Card>
      )}
    </>
  );
}
