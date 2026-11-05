import { useRouter } from 'expo-router';
import { OfferMode, OfferTargets } from '@/domain/offer/offer';
import { MoneyField } from '@/shared/ui/fields';
import { AppText, Button, Card, ListRow, Segmented, ToggleRow } from '@/shared/ui/primitives';
import { formatPerHour, formatPerKm } from '@/shared/utils/format';
import { OfferTargetsState } from './useOfferTargets';

const MODES: { value: OfferMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Período fraco' },
];

function TargetValues({ targets }: { targets: OfferTargetsState }) {
  return (
    <>
      <ListRow title="Mínimo por km" value={formatPerKm(targets.values.targetPerKmCents)} />
      <ListRow title="Mínimo por hora" value={formatPerHour(targets.values.targetPerHourCents)} />
    </>
  );
}

export function OfferTargetsEditor({ targets, suggestion }: { targets: OfferTargetsState; suggestion: OfferTargets | null }) {
  const isNormal = targets.mode === 'normal';
  const following = isNormal && targets.followGoal && !!suggestion;

  return (
    <Card title="Mínimos por corrida">
      <AppText tone="muted">O menor valor que você quer receber em cada corrida. A nota das ofertas usa estes valores.</AppText>
      <Segmented value={targets.mode} options={MODES} onChange={targets.setMode} />
      {isNormal && suggestion ? (
        <ToggleRow
          label="Calcular pela minha meta"
          hint={`Sua meta pede ${formatPerKm(suggestion.targetPerKmCents)} e ${formatPerHour(suggestion.targetPerHourCents)}. Ligado, acompanha a meta quando ela mudar.`}
          value={targets.followGoal}
          onChange={targets.setFollowGoal}
        />
      ) : null}
      {following ? (
        <TargetValues targets={targets} />
      ) : (
        <>
          <MoneyField label="Mínimo por km" hint="Oferta abaixo do seu custo fica vermelha em qualquer modo." {...targets.perKm} />
          <MoneyField label="Mínimo por hora" {...targets.perHour} />
        </>
      )}
    </Card>
  );
}

export function OfferTargetsSummary({ targets }: { targets: OfferTargetsState }) {
  const router = useRouter();

  return (
    <Card title="Mínimos por corrida">
      <AppText tone="muted">A nota das ofertas compara cada corrida com estes valores.</AppText>
      <Segmented value={targets.mode} options={MODES} onChange={targets.setMode} />
      <TargetValues targets={targets} />
      <Button label="Alterar" variant="secondary" onPress={() => router.push('/goal')} />
    </Card>
  );
}
