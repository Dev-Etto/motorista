import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { OfferRow } from '@features/offers';
import type { OfferHistoryEntry } from '@modules/copilot';
import { MIN_TOUCH_TARGET, spacing } from '@shared/theme/theme';
import { AppText, Card } from '@shared/ui/primitives';
import { describeAgo } from './lastOffer';

export function LastOfferCard({ entry, now }: { entry: OfferHistoryEntry; now: number }) {
  const router = useRouter();
  const { t } = useTranslation('dashboard');

  return (
    <Card>
      <View style={styles.header}>
        <AppText bold tone="muted" accessibilityRole="header" style={styles.flex}>
          {t('lastOffer.title', { ago: describeAgo(entry.timestamp, now, t) })}
        </AppText>
        <Pressable accessibilityRole="link" onPress={() => router.navigate('/offer-hub')} style={styles.link}>
          <AppText bold>{t('lastOffer.seeAll')}</AppText>
        </Pressable>
      </View>
      <OfferRow entry={entry} />
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  link: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', paddingLeft: spacing.md },
});
