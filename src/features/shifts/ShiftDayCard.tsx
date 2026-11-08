import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { ShiftDay } from '@domain/shift/days';
import { useFormat } from '@shared/i18n/format';
import { radius, spacing, useTheme } from '@shared/theme/theme';
import { AppText, ListRow } from '@shared/ui/primitives';
import { addDays, today } from '@shared/utils/dates';
import { profitTone } from '@shared/utils/format';

export interface DayShiftRow {
  id: number;
  date: string;
  km: number | null;
  profitCents: number;
  grossCents: number;
  minutes: number;
  startHour: number | null;
  partial: boolean;
}

export function ShiftDayCard({ day }: { day: ShiftDay<DayShiftRow> }) {
  const router = useRouter();
  const colors = useTheme();
  const format = useFormat();
  const { t } = useTranslation('shifts');
  const now = today();
  const dayName = day.date === now ? t('list.today') : day.date === addDays(now, -1) ? t('list.yesterday') : format.date(day.date);
  const count = day.shifts.length;
  const shifts = day.km > 0 ? t('list.dayShiftsKm', { count, distance: format.distance(day.km) }) : t('list.dayShifts', { count });
  const profit = format.money(day.profitCents);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, boxShadow: colors.cardShadow }]}>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={t('list.dayLabel', { day: dayName, shifts, profit })}
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <View style={styles.flex}>
          <AppText bold>{dayName}</AppText>
          <AppText variant="caption" tone="muted">
            {shifts}
          </AppText>
        </View>
        <View style={styles.total}>
          <AppText variant="caption" tone="muted">
            {t('list.dayProfit')}
          </AppText>
          <AppText variant="subtitle" bold tone={profitTone(day.profitCents)}>
            {profit}
          </AppText>
        </View>
      </View>
      <View style={styles.rows}>
        {day.shifts.map((shift) => {
          const subtitle = { gross: format.money(shift.grossCents), duration: format.duration(shift.minutes) };
          return (
            <ListRow
              key={shift.id}
              title={shift.startHour === null ? t('list.shiftTitle') : t('list.shiftTitleHour', { hour: format.hourOfDay(shift.startHour) })}
              subtitle={shift.partial ? t('list.shiftSubtitlePartial', subtitle) : t('list.shiftSubtitle', subtitle)}
              value={format.money(shift.profitCents)}
              valueTone={profitTone(shift.profitCents)}
              onPress={() => router.push(`/shift/${shift.id}`)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  total: { alignItems: 'flex-end' },
  rows: { paddingHorizontal: spacing.lg },
});
