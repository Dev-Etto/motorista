import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { OfferStatus, statusOf } from '@domain/offer/offerLog';
import { OfferHistoryEntry } from '@modules/copilot';
import { Formatter, useFormat } from '@shared/i18n/format';
import { spacing, useTheme } from '@shared/theme/theme';
import { PlatformBadge } from '@shared/ui/PlatformBadge';
import { AppText } from '@shared/ui/primitives';
import { ScoreBadge } from '@shared/ui/ScoreBadge';

const REASON_SEPARATOR = ' · ';

function describeStatus(entry: OfferHistoryEntry, t: TFunction<'offers'>, format: Formatter): string {
  const labels: Record<OfferStatus, string> = {
    accepted: t('status.accepted'),
    declined: t('status.declined'),
    countered: t('status.countered', { amount: format.money(entry.counterCents ?? entry.valueCents) }),
    unanswered: t('status.unanswered'),
  };
  return labels[statusOf(entry)];
}

export function OfferRow({ entry }: { entry: OfferHistoryEntry }) {
  const { t } = useTranslation('offers');
  const colors = useTheme();
  const format = useFormat();

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.header}>
        <View>
          <PlatformBadge name={entry.source} />
        </View>
        <AppText variant="subtitle" bold style={styles.value}>
          {format.money(entry.valueCents)}
        </AppText>
        <ScoreBadge score={entry.score} color={entry.color} />
      </View>
      <AppText>
        {entry.minutes > 0 ? t('row.distanceWithTime', { distance: format.distance(entry.km), minutes: entry.minutes }) : format.distance(entry.km)}
      </AppText>
      <AppText variant="caption" tone="muted">
        {entry.minutes > 0 ? `${format.perDistance(entry.perKmCents)} • ${format.perHour(entry.perHourCents)}` : format.perDistance(entry.perKmCents)}
      </AppText>
      {entry.reason ? (
        <AppText variant="caption" tone="muted">
          {entry.reason.replace(REASON_SEPARATOR, '\n')}
        </AppText>
      ) : null}
      <AppText bold tone={statusOf(entry) === 'accepted' ? 'positive' : 'muted'}>
        {describeStatus(entry, t, format)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  value: { flex: 1 },
});
