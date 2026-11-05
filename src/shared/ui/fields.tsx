import { KeyboardTypeOptions, StyleSheet, TextInput, View } from 'react-native';
import { fonts, fontSize, MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@/shared/theme/theme';
import { AppText } from './primitives';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  hint?: string;
  error?: string | null;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  prefix?: string;
  suffix?: string;
  hideLabel?: boolean;
  multiline?: boolean;
}

export function TextField({ label, value, onChangeText, hint, error, placeholder, keyboardType, prefix, suffix, hideLabel, multiline }: TextFieldProps) {
  const colors = useTheme();
  const borderColor = error ? colors.negative : colors.border;

  return (
    <View style={styles.field}>
      {hideLabel ? null : <AppText variant="caption" tone="muted">{label}</AppText>}
      <View style={[styles.input, { backgroundColor: colors.surface, borderColor }]}>
        {prefix ? <AppText tone="muted">{prefix}</AppText> : null}
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          cursorColor={colors.primary}
          selectionColor={colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[styles.textInput, { color: colors.text }]}
        />
        {suffix ? <AppText tone="muted">{suffix}</AppText> : null}
      </View>
      {error ? <AppText variant="caption" tone="negative">{error}</AppText> : null}
      {hint && !error ? <AppText variant="caption" tone="muted">{hint}</AppText> : null}
    </View>
  );
}

type NumericFieldProps = Omit<TextFieldProps, 'keyboardType'>;

export function NumberField(props: NumericFieldProps) {
  return <TextField keyboardType="decimal-pad" {...props} />;
}

export function MoneyField(props: Omit<NumericFieldProps, 'prefix'>) {
  return <TextField keyboardType="decimal-pad" prefix="R$" placeholder="0,00" {...props} />;
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
  textInput: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.body, paddingVertical: spacing.sm },
});
