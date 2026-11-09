import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { OutcomeFilter } from '@domain/offer/offerLog';
import { useCopilotStatus } from '@features/copilot';
import { useFormat } from '@shared/i18n/format';
import { MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@shared/theme/theme';
import { AppIcon, AppIconName } from '@shared/ui/AppIcon';
import { DateField } from '@shared/ui/DateField';
import { confirmAction } from '@shared/ui/dialog';
import { FilterChips } from '@shared/ui/FilterChips';
import { AppText, Button, Card, EmptyState, Notice, Screen, ToggleRow } from '@shared/ui/primitives';
import { StatTile, StatTiles } from '@shared/ui/StatTile';
import { toJsDate } from '@shared/utils/dates';
import { EstimateCard } from './EstimateCard';
import { OFFER_PERIODS } from './offerPeriod';
import { OfferRow } from './OfferRow';
import { OutcomeSummaryCard } from './OutcomeSummaryCard';
import { ALL_SOURCES, useOffers } from './useOffers';

const DOT = 10;

const OUTCOMES: OutcomeFilter[] = ['accepted', 'notAccepted', 'all'];

export default function OffersHubScreen() {
  const { t } = useTranslation(['offers', 'common']);
  const router = useRouter();
  const colors = useTheme();
  const format = useFormat();
  const status = useCopilotStatus();
  const offers = useOffers();
  const { accessibilityGranted, enabled } = status.current;
  const reading = accessibilityGranted && enabled;
  const periodOptions = OFFER_PERIODS.map((value) => ({ value, label: t(`screen.period.${value}`) }));
  const outcomeOptions = OUTCOMES.map((value) => ({ value, label: t(`screen.outcome.${value}`) }));
  const sourceOptions = [{ value: ALL_SOURCES, label: t('screen.allSources') }, ...offers.sources.map((source) => ({ value: source, label: source }))];

  const confirmClear = () => {
    confirmAction({
      title: t('screen.clearConfirm.title'),
      message: t('screen.clearConfirm.message'),
      actionLabel: t('common:actions.clear'),
      onConfirm: offers.clear,
    });
  };

  return (
    <Screen>
      {accessibilityGranted ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/copilot')}
          style={[styles.status, { backgroundColor: colors.surface, boxShadow: colors.cardShadow }]}
        >
          <View style={[styles.dot, { backgroundColor: reading ? colors.positive : colors.borderStrong }]} />
          <View style={styles.flex}>
            <AppText bold>{reading ? t('hub.reading') : t('hub.paused')}</AppText>
            <AppText variant="caption" tone="muted">
              {t('hub.readingHint')}
            </AppText>
          </View>
          <AppIcon name="chevron" color={colors.textMuted} size={20} />
        </Pressable>
      ) : (
        <Card title={t('hub.copilotTitle')}>
          <AppText tone="muted">{t('hub.setupMessage')}</AppText>
          <Button label={t('hub.setupButton')} onPress={() => router.push('/copilot-setup')} />
        </Card>
      )}

      <FilterChips label={t('screen.periodLabel')} value={offers.period} options={periodOptions} onChange={offers.setPeriod} />
      {offers.period === 'custom' ? (
        <Card>
          <DateField
            label={t('screen.from')}
            value={offers.custom.start}
            maximumDate={toJsDate(offers.custom.end)}
            onChange={(start) => start && offers.setCustom({ ...offers.custom, start })}
          />
          <DateField
            label={t('screen.to')}
            value={offers.custom.end}
            minimumDate={toJsDate(offers.custom.start)}
            maximumDate={new Date()}
            onChange={(end) => end && offers.setCustom({ ...offers.custom, end })}
          />
        </Card>
      ) : null}

      <StatTiles>
        <StatTile label={t('screen.read')} value={String(offers.summary.received)} />
        <StatTile label={t('screen.accepted')} value={String(offers.summary.accepted)} />
        <StatTile label={t('hub.estimated')} value={format.money(offers.estimate.totalCents)} />
      </StatTiles>

      <Card title={t('screen.listTitle')}>
        <FilterChips label={t('screen.outcomeLabel')} value={offers.outcome} options={outcomeOptions} onChange={offers.setOutcome} />
        {offers.sources.length > 1 ? (
          <FilterChips label={t('screen.appLabel')} value={offers.source} options={sourceOptions} onChange={offers.setSource} />
        ) : null}
        {offers.offers.map((entry) => (
          <OfferRow key={entry.timestamp} entry={entry} onCorrected={offers.reload} />
        ))}
        {offers.hasMore ? <Button label={t('screen.seeMore')} variant="secondary" onPress={offers.showMore} /> : null}
      </Card>
      {offers.offers.length === 0 ? (
        <EmptyState
          title={t('screen.emptyTitle')}
          message={t('screen.emptyMessage')}
          action={offers.outcome === 'all' ? undefined : <Button label={t('screen.seeAll')} variant="secondary" onPress={() => offers.setOutcome('all')} />}
        />
      ) : null}

      <View style={styles.tools}>
        <Tool icon="calculator" label={t('hub.evaluateShort')} onPress={() => router.push({ pathname: '/calculator', params: { tab: 'offer' } })} />
        <Tool icon="document" label={t('hub.quoteShort')} onPress={() => router.push({ pathname: '/calculator', params: { tab: 'quote' } })} />
      </View>

      {offers.estimating ? <EstimateCard estimate={offers.estimate} /> : null}
      {offers.estimating ? <OutcomeSummaryCard title={t('screen.outcomeTitle')} summary={offers.summary} /> : null}
      <Notice tone="accent" message={t('screen.autoRecord')} />
      <Card title={t('screen.settingsTitle')}>
        <ToggleRow label={t('screen.estimating')} hint={t('screen.estimatingHint')} value={offers.estimating} onChange={offers.toggleEstimating} />
        <Button label={t('screen.clearButton')} variant="danger" onPress={confirmClear} />
      </Card>
    </Screen>
  );
}

function Tool({ icon, label, onPress }: { icon: AppIconName; label: string; onPress: () => void }) {
  const colors = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.tool, { backgroundColor: colors.surfaceAlt }]}>
      <AppIcon name={icon} color={colors.text} size={20} />
      <AppText bold>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET + spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill },
  tools: { flexDirection: 'row', gap: spacing.sm },
  tool: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET + spacing.sm,
    borderRadius: radius.md,
  },
});
