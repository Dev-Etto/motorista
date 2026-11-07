import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@/shared/theme/theme';
import { formatDate, fromISODate, toISODate } from '@/shared/utils/dates';
import { AppIcon } from './AppIcon';
import { AppText } from './primitives';

interface DateFieldProps {
  label: string;
  value: string | null;
  onChange: (date: string | null) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  clearable?: boolean;
}

export function DateField({ label, value, onChange, placeholder = 'Escolher data', minimumDate, maximumDate, clearable }: DateFieldProps) {
  const colors = useTheme();
  const current = value ? fromISODate(value) : new Date();

  const openAndroid = () => {
    DateTimePickerAndroid.open({
      value: current,
      mode: 'date',
      minimumDate,
      maximumDate,
      onValueChange: (_event, date) => onChange(toISODate(date)),
    });
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.field}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <DateTimePicker
          value={current}
          mode="date"
          display="compact"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onValueChange={(_event, date) => onChange(toISODate(date))}
        />
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDate(value) : placeholder}`}
        onPress={openAndroid}
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <AppIcon name="calendar" color={colors.textMuted} size={22} />
        <AppText tone={value ? 'default' : 'muted'} style={styles.value}>
          {value ? formatDate(value) : placeholder}
        </AppText>
        {clearable && value ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Limpar ${label}`} hitSlop={12} onPress={() => onChange(null)}>
            <AppText tone="muted">Limpar</AppText>
          </Pressable>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  value: { flex: 1 },
});
