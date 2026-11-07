import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { classifyOffer } from '@/domain/offer/offer';
import { OfferTargetsSummary, useOfferTargets } from '@/features/copilot';
import { useFormFields } from '@/shared/hooks/useFormFields';
import { MoneyField, NumberField } from '@/shared/ui/fields';
import { LearnMore } from '@/shared/ui/LearnMore';
import { AppText, Card, Stat, StatGrid } from '@/shared/ui/primitives';
import { ScoreBadge } from '@/shared/ui/ScoreBadge';
import { formatPerHour, formatPerKm, profitTone } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';
import { centsOrZero, decimalOrZero } from '@/shared/utils/parse';

const SCORE_BADGE_HEIGHT = 48;

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
          {result.profitCents === null ? null : (
            <>
              <AppText variant="caption" tone="muted" center>Sobra para você</AppText>
              <AppText variant="display" bold center tone={profitTone(result.profitCents)}>{formatBRL(result.profitCents)}</AppText>
            </>
          )}
          {result.score === null ? null : (
            <View style={styles.score}>
              <ScoreBadge score={result.score} color={result.color} height={SCORE_BADGE_HEIGHT} />
            </View>
          )}
          <AppText center>{result.reason}</AppText>
          <StatGrid>
            <Stat label="Paga por km" value={formatPerKm(result.perKm)} />
            <Stat label="Paga por hora" value={formatPerHour(result.perHour)} />
          </StatGrid>
          <LearnMore title="Como a nota é calculada?">
            <AppText variant="caption">A nota compara a corrida com o seu custo e os seus mínimos. De 3,5 para cima, ela atinge os dois mínimos. Abaixo de 2, não cobre o custo do carro.</AppText>
            <AppText variant="caption">A nota só ajuda: quem decide é sempre você.</AppText>
          </LearnMore>
        </Card>
      ) : null}
      <OfferTargetsSummary targets={targets} />
    </>
  );
}

const styles = StyleSheet.create({
  score: { alignItems: 'center' },
});
