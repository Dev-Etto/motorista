import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { classifyOffer, compareToTarget, TargetComparison } from '@domain/offer/offer';
import { useOfferTargets } from '@features/copilot';
import { useFormFields } from '@shared/hooks/useFormFields';
import { useFormat } from '@shared/i18n/format';
import { MIN_TOUCH_TARGET, spacing } from '@shared/theme/theme';
import { IntegerField, MoneyField, NumberField } from '@shared/ui/fields';
import { LearnMore } from '@shared/ui/LearnMore';
import { AppText, Card, Stat, StatGrid } from '@shared/ui/primitives';
import { ScoreBadge } from '@shared/ui/ScoreBadge';
import { profitTone } from '@shared/utils/format';
import { describeOfferReason } from './describeOfferReason';

const SCORE_BADGE_HEIGHT = 48;
const TARGET_SCORE = 3.5;
const BELOW_COST_SCORE = 2;

export function OfferCalculator({ costPerKm }: { costPerKm: number }) {
  const { bind, values } = useFormFields({ value: '', km: '', minutes: '' });
  const targets = useOfferTargets();
  const router = useRouter();
  const { t } = useTranslation(['calculators', 'common']);
  const { t: tOffers } = useTranslation('offers');
  const format = useFormat();

  const valueCents = format.centsOrZero(values.value);
  const km = format.distanceOrZero(values.km);
  const minutes = format.decimalOrZero(values.minutes);
  const ready = valueCents > 0 && km > 0 && minutes > 0;

  const result = useMemo(() => classifyOffer({ valueCents, km, minutes, costPerKm, ...targets.values }), [valueCents, km, minutes, costPerKm, targets.values]);

  return (
    <>
      <Card>
        <MoneyField label={t('offer.value')} {...bind('value')} />
        <View style={styles.row}>
          <View style={styles.flex}>
            <NumberField label={t('offer.distance')} suffix={format.distanceUnit} {...bind('km')} />
          </View>
          <View style={styles.flex}>
            <IntegerField label={t('offer.time')} suffix={t('common:unit.minutes')} {...bind('minutes')} />
          </View>
        </View>
        <AppText variant="caption" tone="muted">
          {t('offer.distanceHint')}
        </AppText>
      </Card>
      {ready ? (
        <Card>
          <View style={styles.result}>
            {result.score === null ? null : <ScoreBadge score={result.score} color={result.color} height={SCORE_BADGE_HEIGHT} />}
            {result.profitCents === null ? null : (
              <View>
                <AppText variant="caption" tone="muted">
                  {t('offer.profit')}
                </AppText>
                <AppText variant="title" bold tone={profitTone(result.profitCents)}>
                  {format.money(result.profitCents)}
                </AppText>
              </View>
            )}
          </View>
          <AppText variant="caption" tone="muted">
            {describeOfferReason(result.reason, tOffers, format.distanceUnit)}
          </AppText>
          <StatGrid columns={2}>
            <ComparedStat
              label={t('offer.perDistance', { unit: format.distanceUnit })}
              value={format.perDistance(result.perKm)}
              comparison={compareToTarget(result.perKm, targets.values.targetPerKmCents)}
            />
            <ComparedStat
              label={t('offer.perHour')}
              value={format.perHour(result.perHour)}
              comparison={compareToTarget(result.perHour, targets.values.targetPerHourCents)}
            />
          </StatGrid>
          <AppText variant="caption" tone="muted">
            {t('offer.comparedTo', {
              perDistance: format.perDistance(targets.values.targetPerKmCents),
              perHour: format.perHour(targets.values.targetPerHourCents),
            })}
          </AppText>
          <Pressable accessibilityRole="link" onPress={() => router.push('/goal')} style={styles.link}>
            <AppText variant="caption" bold>
              {t('offer.changeTargets')}
            </AppText>
          </Pressable>
          <LearnMore title={t('offer.scoreTitle')}>
            <AppText variant="caption">
              {t('offer.scoreExplain', { target: format.number(TARGET_SCORE), belowCost: format.number(BELOW_COST_SCORE, 0) })}
            </AppText>
            <AppText variant="caption">{t('offer.scoreDisclaimer')}</AppText>
          </LearnMore>
        </Card>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  result: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  link: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
});

function ComparedStat({ label, value, comparison }: { label: string; value: string; comparison: TargetComparison }) {
  const { t } = useTranslation('calculators');
  if (comparison.kind !== 'above' && comparison.kind !== 'below') return <Stat label={label} value={value} />;

  const above = comparison.kind === 'above';
  const delta = t(above ? 'offer.aboveTarget' : 'offer.belowTarget', { percent: comparison.percent });
  return <Stat label={label} value={`${value} · ${delta}`} tone={above ? 'positive' : 'negative'} />;
}
