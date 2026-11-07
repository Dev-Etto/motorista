import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, fontSize, MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@shared/theme/theme';
import { AppText } from './primitives';

interface FilterChipsProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function FilterChips<T extends string>({ label, value, options, onChange }: FilterChipsProps<T>) {
  const colors = useTheme();

  return (
    <View style={styles.group}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.surfaceAlt }]}
            >
              <Text style={[styles.text, { color: selected ? colors.onPrimary : colors.text }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: MIN_TOUCH_TARGET, maxWidth: '100%', justifyContent: 'center', borderRadius: radius.md, paddingHorizontal: spacing.lg },
  text: { fontFamily: fonts.semibold, fontSize: fontSize.body },
});
