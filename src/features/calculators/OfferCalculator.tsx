import { useMemo } from 'react';
import { classifyOffer, OfferColor } from '@/domain/offer/offer';
import { OfferTargetsCard } from '@/features/copilot/OfferTargetsCard';
import { useOfferTargets } from '@/features/copilot/useOfferTargets';
import { useFormFields } from '@/shared/hooks/useFormFields';
import { MoneyField, NumberField } from '@/shared/ui/fields';
import { LearnMore } from '@/shared/ui/LearnMore';
import { AppText, Card, Collapsible, Stat, StatGrid } from '@/shared/ui/primitives';
import { formatPerHour, formatPerKm, profitTone } from '@/shared/utils/format';
import { formatBRL, formatNumber } from '@/shared/utils/money';
import { centsOrZero, decimalOrZero } from '@/shared/utils/parse';

const COLOR_TONES: Record<OfferColor, 'positive' | 'warning' | 'negative' | 'muted'> = {
  green: 'positive',
  yellow: 'warning',
  red: 'negative',
  neutral: 'muted',
};

export function OfferCalculator({ costPerKm }: { costPerKm: number }) {
  const { bind, values } = useFormFields({ value: '', km: '', minutes: '' });
  const targets = useOfferTargets();

  const valueCents = centsOrZero(values.value);
  const km = decimalOrZero(values.km);
  const minutes = decimalOrZero(values.minutes);
  const ready = valueCents > 0 && km > 0 && minutes > 0;

  const result = useMemo(
    () => classifyOffer({ valueCents, km, minutes, costPerKm, ...targets.values }),
    [valueCents, km, minutes, costPerKm, targets.values],
  );

  return (
    <>
      <Card title="Essa corrida compensa?">
        <AppText tone="muted">Digite o que aparece na oferta e veja quanto sobra para você.</AppText>
        <MoneyField label="Quanto a corrida paga" {...bind('value')} />
        <NumberField label="Distância total" suffix="km" hint="Some o caminho até o passageiro e a viagem." {...bind('km')} />
        <NumberField label="Tempo total" suffix="min" {...bind('minutes')} />
      </Card>
      {ready ? (
        <Card>
          <AppText variant="caption" tone="muted" center>Sobra para você</AppText>
          <AppText variant="display" bold center tone={profitTone(result.profitCents)}>{formatBRL(result.profitCents)}</AppText>
          {result.score === null ? null : (
            <AppText variant="subtitle" bold center tone={COLOR_TONES[result.color]}>Nota {formatNumber(result.score)} de 10</AppText>
          )}
          <AppText center>{result.reason}</AppText>
          <StatGrid>
            <Stat label="Paga por km" value={formatPerKm(result.perKm)} />
            <Stat label="Paga por hora" value={formatPerHour(result.perHour)} />
          </StatGrid>
          <LearnMore title="Como a nota é calculada?">
            <AppText variant="caption">A nota compara a corrida com o seu custo e as suas metas. De 7 para cima, ela atinge as duas metas. Abaixo de 4, não cobre o custo do carro.</AppText>
            <AppText variant="caption">A nota só ajuda: quem decide é sempre você.</AppText>
          </LearnMore>
        </Card>
      ) : null}
      <Collapsible title="Minhas metas">
        <AppText tone="muted">O mínimo que você quer ganhar. A nota usa esses valores.</AppText>
        <OfferTargetsCard targets={targets} />
      </Collapsible>
    </>
  );
}
