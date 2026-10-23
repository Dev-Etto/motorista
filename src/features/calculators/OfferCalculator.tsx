import { useMemo } from 'react';
import { classifyOffer, OfferColor } from '@/domain/offer/offer';
import { useFormFields } from '@/shared/hooks/useFormFields';
import { MoneyField, NumberField } from '@/shared/ui/fields';
import { AppText, Card, Notice, Stat, StatGrid } from '@/shared/ui/primitives';
import { formatPerHour, formatPerKm, profitTone } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';
import { centsOrZero, decimalOrZero } from '@/shared/utils/parse';
import { useOfferTargets } from './useOfferTargets';

const COLOR_LABELS: Record<OfferColor, { label: string; tone: 'positive' | 'warning' | 'negative' }> = {
  green: { label: 'Verde: atinge suas duas metas', tone: 'positive' },
  yellow: { label: 'Amarelo: cobre o custo, mas fica abaixo de uma meta', tone: 'warning' },
  red: { label: 'Vermelho: não cobre o custo completo', tone: 'negative' },
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
      <Card title="Vale a pena?">
        <MoneyField label="Valor da oferta" {...bind('value')} />
        <NumberField label="Km totais (até o passageiro + viagem)" suffix="km" {...bind('km')} />
        <NumberField label="Minutos totais" suffix="min" {...bind('minutes')} />
      </Card>
      {ready ? (
        <Card title="Seus números">
          <AppText bold tone={COLOR_LABELS[result.color].tone}>{COLOR_LABELS[result.color].label}</AppText>
          <StatGrid>
            <Stat label="Lucro estimado" value={formatBRL(result.profitCents)} tone={profitTone(result.profitCents)} />
            <Stat label="Por km" value={formatPerKm(result.perKm)} />
            <Stat label="Por hora" value={formatPerHour(result.perHour)} />
            <Stat label="Seu custo" value={formatPerKm(costPerKm)} />
          </StatGrid>
          <Notice tone="accent" message="A decisão é sempre sua." />
        </Card>
      ) : null}
      <Card title="Suas metas">
        <MoneyField label="Mínimo por km" {...targets.bind('perKm')} />
        <MoneyField label="Mínimo por hora" {...targets.bind('perHour')} />
      </Card>
    </>
  );
}
