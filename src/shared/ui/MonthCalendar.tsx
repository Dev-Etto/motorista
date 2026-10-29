import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, radius, useTheme } from '@/shared/theme/theme';
import { formatBRL } from '@/shared/utils/money';
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

const WEEKDAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const CELL_MIN_HEIGHT = 48;

function dayLabel(cell: CalendarDayView) {
  if (cell.profitCents === null) return `Dia ${cell.day}, sem jornada`;
  return `Dia ${cell.day}, lucro de ${formatBRL(cell.profitCents)}`;
}

export function MonthCalendar({ weeks, selectedDate, onSelect }: MonthCalendarProps) {
  const colors = useTheme();

  return (
    <View style={styles.grid}>
      <View style={styles.week}>
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={index} style={styles.cell}>
            <AppText variant="caption" tone="muted">{label}</AppText>
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
                accessibilityLabel={dayLabel(cell)}
                accessibilityState={{ selected }}
                onPress={() => onSelect(cell.date)}
                style={[styles.cell, styles.day, selected && { backgroundColor: colors.surfaceAlt }]}
              >
                <AppText bold={hasShift}>{cell.day}</AppText>
                {hasShift ? (
                  <View style={[styles.marker, { backgroundColor: cell.profitCents! < 0 ? colors.negative : colors.positive }]} />
                ) : null}
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
