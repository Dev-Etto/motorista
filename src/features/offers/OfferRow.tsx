import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { OfferStatus, statusOf } from '@domain/offer/offerLog';
import { copilot, OfferHistoryEntry } from '@modules/copilot';
import { Formatter, useFormat } from '@shared/i18n/format';
import { radius, spacing, ThemeColors, useTheme } from '@shared/theme/theme';
import { AppIcon, AppIconName } from '@shared/ui/AppIcon';
import { showDialog } from '@shared/ui/dialog';
import { PlatformBadge } from '@shared/ui/PlatformBadge';
import { AppText } from '@shared/ui/primitives';
import { ScoreBadge } from '@shared/ui/ScoreBadge';
import { clockOfMillis } from '@shared/utils/dates';
import { reportError } from '@shared/utils/reportError';

const REASON_SEPARATOR = ' · ';
const STATUS_SEAL_SIZE = 20;
const STATUS_ICON_SIZE = 12;

const STATUS_SEALS: Partial<Record<OfferStatus, { icon: AppIconName; fill: keyof ThemeColors; ink: keyof ThemeColors }>> = {
  accepted: { icon: 'check', fill: 'positive', ink: 'surface' },
  declined: { icon: 'close', fill: 'borderStrong', ink: 'surface' },
  countered: { icon: 'swap', fill: 'warning', ink: 'surface' },
};
const ESTIMATE_MARK = '~';

function describeStatus(entry: OfferHistoryEntry, t: TFunction<'offers'>, format: Formatter): string {
  const labels: Record<OfferStatus, string> = {
    accepted: t('status.accepted'),
    declined: t('status.declined'),
    countered: t('status.countered', { amount: format.money(entry.counterCents ?? entry.valueCents) }),
    unanswered: t('status.unanswered'),
  };
  return labels[statusOf(entry)];
}

function describeDistance(entry: OfferHistoryEntry, t: TFunction<'offers'>, format: Formatter): string {
  const distance = format.distance(entry.km);
  if (entry.minutes <= 0) return distance;
  const key = entry.minutesEstimated ? 'row.distanceWithEstimatedTime' : 'row.distanceWithTime';
  return t(key, { distance, minutes: entry.minutes });
}

function describeRates(entry: OfferHistoryEntry, format: Formatter): string {
  const perDistance = format.perDistance(entry.perKmCents);
  if (entry.minutes <= 0) return perDistance;
  const mark = entry.minutesEstimated ? ESTIMATE_MARK : '';
  return `${perDistance} • ${mark}${format.perHour(entry.perHourCents)}`;
}

export function OfferRow({ entry, onCorrected }: { entry: OfferHistoryEntry; onCorrected?: () => void }) {
  const { t } = useTranslation('offers');
  const colors = useTheme();
  const format = useFormat();

  const seal = STATUS_SEALS[statusOf(entry)];

  const spoken = [
    entry.source,
    format.money(entry.valueCents),
    entry.score === undefined ? null : t('row.scoreSpoken', { score: format.number(entry.score) }),
    describeDistance(entry, t, format),
    describeRates(entry, format),
    describeStatus(entry, t, format),
  ]
    .filter(Boolean)
    .join(', ');

  const correct = (status: 'accepted' | 'declined') => {
    copilot
      .setOfferStatus(entry.timestamp, status)
      .then(() => onCorrected?.())
      .catch(reportError);
  };

  const chooseOutcome = () => {
    showDialog({
      title: t('correct.title'),
      message: t('correct.message'),
      actions: [
        { label: t('correct.accepted'), onPress: () => correct('accepted') },
        { label: t('correct.declined'), tone: 'secondary', onPress: () => correct('declined') },
        { label: t('correct.cancel'), tone: 'secondary' },
      ],
    });
  };

  return (
    <Pressable
      accessible
      accessibilityRole={onCorrected ? 'button' : undefined}
      accessibilityLabel={spoken}
      accessibilityHint={onCorrected ? t('correct.hint') : undefined}
      onPress={onCorrected ? chooseOutcome : undefined}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={styles.flag}>
        <PlatformBadge name={entry.source} />
        {seal ? (
          <View testID="offer-status-seal" style={[styles.seal, { backgroundColor: colors[seal.fill], borderColor: colors.surface }]}>
            <AppIcon name={seal.icon} color={colors[seal.ink]} size={STATUS_ICON_SIZE} />
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <AppText variant="subtitle" bold>
          {format.money(entry.valueCents)}
        </AppText>
        <AppText variant="caption">{`${clockOfMillis(entry.timestamp)} · ${describeDistance(entry, t, format)}`}</AppText>
        <AppText variant="caption" tone="muted">
          {describeRates(entry, format)}
        </AppText>
        {entry.reason ? (
          <AppText variant="caption" tone="muted">
            {entry.reason.replace(REASON_SEPARATOR, '\n')}
          </AppText>
        ) : null}
      </View>
      <ScoreBadge score={entry.score} color={entry.color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  flag: { paddingTop: spacing.xs, paddingRight: spacing.xs },
  seal: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: STATUS_SEAL_SIZE,
    height: STATUS_SEAL_SIZE,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
});
