import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useWorkProfile } from '@application/workProfile';
import { useCopilotStatus } from '@features/copilot';
import { useFormat } from '@shared/i18n/format';
import { MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@shared/theme/theme';
import { AppIcon, AppIconName } from '@shared/ui/AppIcon';
import { AppText, Button, Card, Screen } from '@shared/ui/primitives';
import { StatTile, StatTiles } from '@shared/ui/StatTile';
import { OfferRow } from './OfferRow';
import { useTodayOffers } from './useTodayOffers';

const DOT = 10;

export default function OffersHubScreen() {
  const { t } = useTranslation('offers');
  const workProfile = useWorkProfile();
  const router = useRouter();
  const colors = useTheme();
  const format = useFormat();
  const status = useCopilotStatus();
  const offers = useTodayOffers();
  const { accessibilityGranted, enabled } = status.current;
  const reading = accessibilityGranted && enabled;

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
          <AppText tone="muted">{t('hub.setupMessage', { context: workProfile })}</AppText>
          <Button label={t('hub.setupButton')} onPress={() => router.push('/copilot-setup')} />
        </Card>
      )}

      <StatTiles>
        <StatTile label={t('hub.readToday')} value={String(offers.day.read)} />
        <StatTile label={t('hub.acceptedToday')} value={String(offers.day.accepted)} />
        <StatTile label={t('hub.estimatedToday')} value={format.money(offers.day.estimatedCents)} />
      </StatTiles>

      <View style={styles.sectionHeader}>
        <AppText bold accessibilityRole="header" style={styles.flex}>
          {t('hub.todayTitle')}
        </AppText>
        <Pressable accessibilityRole="link" onPress={() => router.push('/offers')} style={styles.link}>
          <AppText bold tone="muted">
            {t('hub.seeAllShort')}
          </AppText>
        </Pressable>
      </View>
      <Card>
        {offers.recent.length === 0 ? <AppText tone="muted">{t('hub.emptyToday')}</AppText> : null}
        {offers.recent.map((entry) => (
          <OfferRow key={entry.timestamp} entry={entry} onCorrected={offers.refresh} />
        ))}
      </Card>

      <View style={styles.tools}>
        <Tool icon="calculator" label={t('hub.evaluateShort')} onPress={() => router.push({ pathname: '/calculator', params: { tab: 'offer' } })} />
        <Tool icon="document" label={t('hub.quoteShort')} onPress={() => router.push({ pathname: '/calculator', params: { tab: 'quote' } })} />
      </View>
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xs },
  link: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', paddingLeft: spacing.md },
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
