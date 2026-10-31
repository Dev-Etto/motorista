import { Share } from 'react-native';
import { useMemo } from 'react';
import { quoteRepository } from '@/data/repositories/quoteRepository';
import { computeQuote } from '@/domain/quote/quote';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { useFormFields } from '@/shared/hooks/useFormFields';
import { MoneyField, NumberField, TextField } from '@/shared/ui/fields';
import { AppText, Button, ButtonRow, Card, Collapsible, ListRow, Notice } from '@/shared/ui/primitives';
import { confirmAction } from '@/shared/utils/confirm';
import { profitTone } from '@/shared/utils/format';
import { formatBRL, formatNumber } from '@/shared/utils/money';
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

  const remove = (id: number) => {
    confirmAction({
      title: 'Remover orçamento?',
      message: 'Essa ação não pode ser desfeita.',
      actionLabel: 'Remover',
      onConfirm: async () => {
        await quoteRepository.remove(id);
        await saved.reload();
      },
    });
  };

  return (
    <>
      <Card title="Quanto cobrar nessa corrida?">
        <AppText tone="muted">Para corridas combinadas direto com o passageiro, fora dos apps.</AppText>
        <NumberField label="Até buscar o passageiro" suffix="km" {...bind('kmToPassenger')} />
        <NumberField label="Da viagem" suffix="km" {...bind('kmTrip')} />
        <NumberField label="Tempo total" suffix="min" hint="Inclua o caminho até o passageiro." {...bind('minutes')} />
      </Card>
      <Collapsible title="Mais opções">
        <NumberField label="Volta sem passageiro" suffix="km" hint="Se precisar voltar por sua conta." {...bind('kmReturn')} />
        <MoneyField label="Quanto quer ganhar por hora" hint="É o valor do seu tempo no preço sugerido." {...bind('profitPerHour')} />
        <MoneyField label="Pedágio" {...bind('toll')} />
        <MoneyField label="Espera ou outros extras" {...bind('extras')} />
        <MoneyField label="Não cobrar menos que" hint="Corrida curta pode dar um preço muito baixo. Se isso acontecer, o app sugere este valor." {...bind('minimum')} />
      </Collapsible>
      {ready ? (
        <Card>
          <AppText variant="caption" tone="muted" center>Preço sugerido</AppText>
          <AppText variant="display" bold center>{formatBRL(quote.priceCents)}</AppText>
          {quote.belowCost ? <Notice tone="negative" message="Esse valor fica abaixo do seu custo." /> : null}
          <ListRow title="Para o carro" subtitle={`${formatNumber(quote.totalKm)} km com o seu custo por km`} value={formatBRL(quote.vehicleCostCents)} />
          <ListRow title="Pelo seu tempo" value={formatBRL(quote.timeCents)} />
          {quote.tollCents + quote.extrasCents > 0 ? <ListRow title="Pedágio e extras" value={formatBRL(quote.tollCents + quote.extrasCents)} /> : null}
          <ListRow title="Sobra para você" value={formatBRL(quote.estimatedProfitCents)} valueTone={profitTone(quote.estimatedProfitCents)} />
          <TextField label="Descrição (opcional)" placeholder="Centro ao aeroporto" {...bind('label')} />
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
