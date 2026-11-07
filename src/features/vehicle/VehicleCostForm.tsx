import { MoneyField, NumberField, TextField } from '@/shared/ui/fields';
import { AppText, Card, Collapsible, Notice, Segmented, ToggleRow } from '@/shared/ui/primitives';
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
        <AppText variant="caption" tone="muted">
          Tipo
        </AppText>
        <Segmented value={form.kind} options={KIND_OPTIONS} onChange={form.setKind} />
        <AppText variant="caption" tone="muted">
          Combustível
        </AppText>
        <Segmented value={form.fuel} options={FUEL_OPTIONS} onChange={form.setFuel} />
        <AppText variant="caption" tone="muted">
          Situação do veículo
        </AppText>
        <Segmented value={ownership} options={OWNERSHIP_OPTIONS} onChange={form.setOwnership} />
      </Card>

      <Card title="Uso e combustível">
        <NumberField label="Km previstos por mês" suffix="km" hint="Quanto mais você roda, mais os custos fixos se diluem." {...bind('plannedKm')} />
        <MoneyField label="Preço do combustível" {...bind('fuelPrice')} />
        <NumberField label="Consumo" suffix={CONSUMPTION_UNITS[form.fuel]} hint="Quantos km o veículo faz com um litro." {...bind('consumption')} />
      </Card>

      <Collapsible title="Desgaste">
        <MoneyField label="Troca de óleo" {...bind('oilChange')} />
        <NumberField label="Intervalo da troca" suffix="km" {...bind('oilInterval')} />
        <MoneyField label="Jogo de pneus" {...bind('tires')} />
        <NumberField label="Vida útil dos pneus" suffix="km" {...bind('tiresLife')} />
        <MoneyField label="Manutenção por mês" {...bind('maintenance')} />
      </Collapsible>

      <Collapsible title="Custos fixos">
        <MoneyField label="Seguro por mês" {...bind('insurance')} />
        <MoneyField label="IPVA por ano" {...bind('ipva')} />
        <MoneyField label="Licenciamento por ano" {...bind('licensing')} />
        {ownership === 'owned' ? null : <MoneyField label={ownership === 'rented' ? 'Aluguel por mês' : 'Parcela por mês'} {...bind('payment')} />}
        <MoneyField label="Outros custos fixos por mês" {...bind('otherFixed')} />
      </Collapsible>

      {ownership === 'rented' ? null : (
        <Collapsible title="Depreciação">
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
        </Collapsible>
      )}
    </>
  );
}
