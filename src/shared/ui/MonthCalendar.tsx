import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Formatter, useFormat } from '@shared/i18n/format';
import { spacing, radius, useTheme } from '@shared/theme/theme';
import { AppText } from './primitives';

interface CalendarDayView {
  date: string;
  day: number;
  profitCents: number | null;
}

interface MonthCalendarProps {
  weeks: (CalendarDayView | null)[][];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

const CELL_MIN_HEIGHT = 48;

function dayLabel(cell: CalendarDayView, t: TFunction, format: Formatter) {
  if (cell.profitCents === null) return t('monthCalendar.dayEmpty', { day: cell.day });
  return t('monthCalendar.dayProfit', { day: cell.day, profit: format.money(cell.profitCents) });
}

export function MonthCalendar({ weeks, selectedDate, onSelect }: MonthCalendarProps) {
  const colors = useTheme();
  const format = useFormat();
  const { t } = useTranslation();

  return (
    <View style={styles.grid}>
      <View style={styles.week}>
        {format.weekdays().map((weekday) => (
          <View key={weekday} style={styles.cell}>
            <AppText variant="caption" tone="muted">
              {format.weekday(weekday).charAt(0)}
            </AppText>
          </View>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((cell, dayIndex) => {
            if (!cell) return <View key={dayIndex} style={styles.cell} />;

            const selected = cell.date === selectedDate;
            const hasShift = cell.profitCents !== null;
            return (
              <Pressable
                key={cell.date}
                accessibilityRole="button"
                accessibilityLabel={dayLabel(cell, t, format)}
                accessibilityState={{ selected }}
                onPress={() => onSelect(cell.date)}
                style={[styles.cell, styles.day, selected && { backgroundColor: colors.surfaceAlt }]}
              >
                <AppText bold={hasShift}>{cell.day}</AppText>
                {hasShift ? <View style={[styles.marker, { backgroundColor: cell.profitCents! < 0 ? colors.negative : colors.positive }]} /> : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.xs },
  week: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  day: { minHeight: CELL_MIN_HEIGHT, borderRadius: radius.sm, gap: 2 },
  marker: { width: 18, height: 4, borderRadius: radius.pill },
});
