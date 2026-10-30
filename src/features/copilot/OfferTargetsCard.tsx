import { useRouter } from 'expo-router';
import { OfferMode } from '@/domain/offer/offer';
import { loadGoalProgress } from '@/features/goals/goalProgress';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { MoneyField } from '@/shared/ui/fields';
import { AppText, Button, Card, Segmented } from '@/shared/ui/primitives';
import { today } from '@/shared/utils/dates';
import { formatPerHour, formatPerKm } from '@/shared/utils/format';
import { OfferTargetsState } from './useOfferTargets';

const MODES: { value: OfferMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Período fraco' },
];

export function OfferTargetsCard({ targets }: { targets: OfferTargetsState }) {
  const router = useRouter();
  const { data: progress } = useAsyncData(() => loadGoalProgress(today()));
  const suggestion = progress?.suggestion ?? null;

  return (
    <Card title="Suas metas por corrida">
      <AppText tone="muted">A nota das ofertas compara cada corrida com estes valores.</AppText>
      <Segmented value={targets.mode} options={MODES} onChange={targets.setMode} />
      <MoneyField label="Mínimo por km" hint="Oferta abaixo do seu custo fica vermelha em qualquer modo." {...targets.perKm} />
      <MoneyField label="Mínimo por hora" {...targets.perHour} />
      {suggestion ? (
        <Button
          label={`Usar os da minha meta: ${formatPerKm(suggestion.targetPerKmCents)} e ${formatPerHour(suggestion.targetPerHourCents)}`}
          variant="secondary"
          onPress={() => targets.replaceTargets({ targetPerKmCents: suggestion.targetPerKmCents, targetPerHourCents: suggestion.targetPerHourCents })}
        />
      ) : (
        <Button label="Calcular pela minha meta do mês" variant="secondary" onPress={() => router.push('/goal')} />
      )}
    </Card>
  );
}
