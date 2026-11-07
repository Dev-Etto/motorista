import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFormat } from '@shared/i18n/format';
import { MIN_TOUCH_TARGET, radius, spacing, useTheme, fonts } from '@shared/theme/theme';

export function WeekdayPicker({ selected, onToggle }: { selected: number[]; onToggle: (weekday: number) => void }) {
  const colors = useTheme();
  const format = useFormat();

  return (
    <View style={styles.row}>
      {format.weekdays().map((weekday) => {
        const active = selected.includes(weekday);
        const name = format.weekday(weekday);
        return (
          <Pressable
            key={weekday}
            accessibilityRole="button"
            accessibilityLabel={name}
            accessibilityState={{ selected: active }}
            onPress={() => onToggle(weekday)}
            style={[styles.day, { backgroundColor: active ? colors.primary : colors.surfaceAlt }]}
          >
            <Text style={{ color: active ? colors.onPrimary : colors.text, fontFamily: fonts.bold }}>{name.charAt(0)}</Text>
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
