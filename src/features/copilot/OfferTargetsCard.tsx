import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OfferMode, OfferTargets } from '@domain/offer/offer';
import { useFormat } from '@shared/i18n/format';
import { MoneyField } from '@shared/ui/fields';
import { AppText, Button, Card, ListRow, Notice, Segmented, ToggleRow } from '@shared/ui/primitives';
import { OfferTargetsState } from './useOfferTargets';

const MODES: OfferMode[] = ['normal', 'low'];

function useModeOptions() {
  const { t } = useTranslation('copilot');
  return MODES.map((value) => ({ value, label: t(`targets.mode.${value}`) }));
}

function TargetValues({ targets }: { targets: OfferTargetsState }) {
  const { t } = useTranslation('copilot');
  const format = useFormat();
  return (
    <>
      <ListRow title={t('targets.minPerDistance', { context: format.distanceUnit })} value={format.perDistance(targets.values.targetPerKmCents)} />
      <ListRow title={t('targets.minPerHour')} value={format.perHour(targets.values.targetPerHourCents)} />
    </>
  );
}

export function OfferTargetsEditor({ targets, suggestion }: { targets: OfferTargetsState; suggestion: OfferTargets | null }) {
  const isNormal = targets.mode === 'normal';
  const following = isNormal && targets.followGoal && !!suggestion;
  const { t } = useTranslation('copilot');
  const format = useFormat();
  const modes = useModeOptions();

  return (
    <Card title={t('targets.title')}>
      <AppText tone="muted">{t('targets.editorIntro')}</AppText>
      <Segmented value={targets.mode} options={modes} onChange={targets.setMode} />
      {isNormal && suggestion ? (
        <ToggleRow
          label={t('targets.followGoal')}
          hint={t('targets.followGoalHint', {
            perDistance: format.perDistance(suggestion.targetPerKmCents),
            perHour: format.perHour(suggestion.targetPerHourCents),
          })}
          value={targets.followGoal}
          onChange={targets.setFollowGoal}
        />
      ) : null}
      {following ? (
        <TargetValues targets={targets} />
      ) : (
        <>
          <MoneyField label={t('targets.minPerDistance', { context: format.distanceUnit })} hint={t('targets.belowCostHint')} {...targets.perKm} />
          <MoneyField label={t('targets.minPerHour')} {...targets.perHour} />
          {targets.saveError ? <Notice tone="negative" message={targets.saveError} /> : null}
        </>
      )}
    </Card>
  );
}

export function OfferTargetsSummary({ targets }: { targets: OfferTargetsState }) {
  const { t } = useTranslation('copilot');
  const router = useRouter();
  const modes = useModeOptions();

  return (
    <Card title={t('targets.title')}>
      <AppText tone="muted">{t('targets.summaryIntro')}</AppText>
      <Segmented value={targets.mode} options={modes} onChange={targets.setMode} />
      <TargetValues targets={targets} />
      <Button label={t('targets.change')} variant="secondary" onPress={() => router.push('/goal')} />
    </Card>
  );
}
