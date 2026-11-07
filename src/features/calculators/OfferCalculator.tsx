import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { classifyOffer } from '@domain/offer/offer';
import { OfferTargetsSummary, useOfferTargets } from '@features/copilot';
import { useFormFields } from '@shared/hooks/useFormFields';
import { useFormat } from '@shared/i18n/format';
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
      <Card title={t('offer.title')}>
        <AppText tone="muted">{t('offer.intro')}</AppText>
        <MoneyField label={t('offer.value')} {...bind('value')} />
        <NumberField label={t('offer.distance')} suffix={format.distanceUnit} hint={t('offer.distanceHint')} {...bind('km')} />
        <IntegerField label={t('offer.time')} suffix={t('common:unit.minutes')} {...bind('minutes')} />
      </Card>
      {ready ? (
        <Card>
          {result.profitCents === null ? null : (
            <>
              <AppText variant="caption" tone="muted" center>
                {t('offer.profit')}
              </AppText>
              <AppText variant="display" bold center tone={profitTone(result.profitCents)}>
                {format.money(result.profitCents)}
              </AppText>
            </>
          )}
          {result.score === null ? null : (
            <View style={styles.score}>
              <ScoreBadge score={result.score} color={result.color} height={SCORE_BADGE_HEIGHT} />
            </View>
          )}
          <AppText center>{describeOfferReason(result.reason, tOffers, format.distanceUnit)}</AppText>
          <StatGrid>
            <Stat label={t('offer.perDistance', { unit: format.distanceUnit })} value={format.perDistance(result.perKm)} />
            <Stat label={t('offer.perHour')} value={format.perHour(result.perHour)} />
          </StatGrid>
          <LearnMore title={t('offer.scoreTitle')}>
            <AppText variant="caption">
              {t('offer.scoreExplain', { target: format.number(TARGET_SCORE), belowCost: format.number(BELOW_COST_SCORE, 0) })}
            </AppText>
            <AppText variant="caption">{t('offer.scoreDisclaimer')}</AppText>
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
