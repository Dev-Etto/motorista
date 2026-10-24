import { Share } from 'react-native';
import { useMemo } from 'react';
import { quoteRepository } from '@/data/repositories/quoteRepository';
import { computeQuote } from '@/domain/quote/quote';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { useFormFields } from '@/shared/hooks/useFormFields';
import { MoneyField, NumberField, TextField } from '@/shared/ui/fields';
import { AppText, Button, ButtonRow, Card, ListRow, Notice, Stat, StatGrid } from '@/shared/ui/primitives';
import { formatPerKm, profitTone } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';
import { centsOrZero, decimalOrZero } from '@/shared/utils/parse';

const INITIAL = { label: '', kmToPassenger: '', kmTrip: '', kmReturn: '', minutes: '', profitPerHour: '30,00', toll: '', extras: '', minimum: '' };

function buildShareMessage(label: string, priceCents: number) {
  const trip = label.trim() ? `Viagem: ${label.trim()}\n` : '';
  return `${trip}Valor: ${formatBRL(priceCents)}`;
}

export function QuoteCalculator({ costPerKm }: { costPerKm: number }) {
  const { bind, values } = useFormFields(INITIAL);
  const saved = useAsyncData(() => quoteRepository.list());

  const quote = useMemo(
    () =>
      computeQuote({
        kmToPassenger: decimalOrZero(values.kmToPassenger),
        kmTrip: decimalOrZero(values.kmTrip),
        kmReturn: decimalOrZero(values.kmReturn),
        minutes: decimalOrZero(values.minutes),
        costPerKm,
        desiredProfitPerHourCents: centsOrZero(values.profitPerHour),
        tollCents: centsOrZero(values.toll),
        extrasCents: centsOrZero(values.extras),
        minimumCents: centsOrZero(values.minimum),
      }),
    [values, costPerKm],
  );
  const ready = quote.totalKm > 0;

  const save = async () => {
    await quoteRepository.save(values.label.trim() || null, quote.priceCents, values);
    await saved.reload();
  };

  const share = () => Share.share({ message: buildShareMessage(values.label, quote.priceCents) });

  const remove = async (id: number) => {
    await quoteRepository.remove(id);
    await saved.reload();
  };

  return (
    <>
      <Card title="Viagem particular">
        <TextField label="Descrição (opcional)" {...bind('label')} />
        <NumberField label="Km até o passageiro" suffix="km" {...bind('kmToPassenger')} />
        <NumberField label="Km da viagem" suffix="km" {...bind('kmTrip')} />
        <NumberField label="Km de retorno (opcional)" suffix="km" {...bind('kmReturn')} />
        <NumberField label="Minutos totais" suffix="min" {...bind('minutes')} />
        <MoneyField label="Lucro desejado por hora" {...bind('profitPerHour')} />
        <MoneyField label="Pedágio" {...bind('toll')} />
        <MoneyField label="Espera e extras" {...bind('extras')} />
        <MoneyField label="Valor mínimo" {...bind('minimum')} />
      </Card>
      {ready ? (
        <Card title="Preço sugerido">
          <AppText variant="display" bold>{formatBRL(quote.priceCents)}</AppText>
          {quote.belowCost ? <Notice tone="negative" message="Esse valor fica abaixo do seu custo." /> : null}
          <StatGrid>
            <Stat label="Lucro estimado" value={formatBRL(quote.estimatedProfitCents)} tone={profitTone(quote.estimatedProfitCents)} />
            <Stat label="Por km" value={formatPerKm(quote.perKm)} />
            <Stat label="Custo do veículo" value={formatBRL(quote.vehicleCostCents)} />
            <Stat label="Tempo" value={formatBRL(quote.timeCents)} />
          </StatGrid>
          <ButtonRow>
            <Button label="Compartilhar" onPress={share} />
            <Button label="Salvar" variant="secondary" onPress={save} />
          </ButtonRow>
        </Card>
      ) : null}
      {saved.data?.length ? (
        <Card title="Orçamentos salvos">
          {saved.data.map((item) => (
            <ListRow
              key={item.id}
              title={item.label ?? 'Sem descrição'}
              subtitle="Toque para remover"
              value={formatBRL(item.price_cents)}
              onPress={() => remove(item.id)}
            />
          ))}
        </Card>
      ) : null}
    </>
  );
}
