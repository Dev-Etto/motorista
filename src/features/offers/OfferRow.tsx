import { StyleSheet, View } from 'react-native';
import { OfferStatus, statusOf } from '@/domain/offer/offerLog';
import { spacing, useTheme } from '@/shared/theme/theme';
import { PlatformBadge } from '@/shared/ui/PlatformBadge';
import { AppText } from '@/shared/ui/primitives';
import { ScoreBadge } from '@/shared/ui/ScoreBadge';
import { formatPerHour, formatPerKm } from '@/shared/utils/format';
import { formatBRL, formatNumber } from '@/shared/utils/money';
import { OfferHistoryEntry } from '@modules/copilot';

const REASON_SEPARATOR = ' · ';

function describeStatus(entry: OfferHistoryEntry): string {
  const labels: Record<OfferStatus, string> = {
    accepted: 'Aceita',
    declined: 'Recusada',
    countered: `Contraoferta de ${formatBRL(entry.counterCents ?? entry.valueCents)}`,
    unanswered: 'Sem resposta',
  };
  return labels[statusOf(entry)];
}

export function OfferRow({ entry }: { entry: OfferHistoryEntry }) {
  const colors = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.header}>
        <View>
          <PlatformBadge name={entry.source} />
        </View>
        <AppText variant="subtitle" bold style={styles.value}>
          {formatBRL(entry.valueCents)}
        </AppText>
        <ScoreBadge score={entry.score} color={entry.color} />
      </View>
      <AppText>{entry.minutes > 0 ? `${formatNumber(entry.km)} km • ${entry.minutes} min` : `${formatNumber(entry.km)} km`}</AppText>
      <AppText variant="caption" tone="muted">
        {entry.minutes > 0 ? `${formatPerKm(entry.perKmCents)} • ${formatPerHour(entry.perHourCents)}` : formatPerKm(entry.perKmCents)}
      </AppText>
      {entry.reason ? (
        <AppText variant="caption" tone="muted">
          {entry.reason.replace(REASON_SEPARATOR, '\n')}
        </AppText>
      ) : null}
      <AppText bold tone={statusOf(entry) === 'accepted' ? 'positive' : 'muted'}>
        {describeStatus(entry)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  value: { flex: 1 },
});
