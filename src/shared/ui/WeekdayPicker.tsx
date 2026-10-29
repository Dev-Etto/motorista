import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@/shared/theme/theme';
import { weekdayName } from '@/shared/utils/dates';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

export function WeekdayPicker({ selected, onToggle }: { selected: number[]; onToggle: (weekday: number) => void }) {
  const colors = useTheme();

  return (
    <View style={styles.row}>
      {WEEKDAYS.map((weekday) => {
        const active = selected.includes(weekday);
        const name = weekdayName(weekday);
        return (
          <Pressable
            key={weekday}
            accessibilityRole="button"
            accessibilityLabel={name}
            accessibilityState={{ selected: active }}
            onPress={() => onToggle(weekday)}
            style={[styles.day, { backgroundColor: active ? colors.primary : colors.surfaceAlt }]}
          >
            <Text style={{ color: active ? colors.onPrimary : colors.text, fontWeight: '700' }}>{name.charAt(0)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  day: { flex: 1, minHeight: MIN_TOUCH_TARGET, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
