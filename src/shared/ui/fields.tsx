import { KeyboardTypeOptions, StyleSheet, TextInput, View } from 'react-native';
import { useFormat } from '@shared/i18n/format';
import { fonts, fontSize, MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@shared/theme/theme';
import { completeDecimals, maskDecimal, maskDuration, maskInteger } from '@shared/utils/inputMask';
import { AppText } from './primitives';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  hint?: string;
  error?: string | null;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  prefix?: string;
  suffix?: string;
  hideLabel?: boolean;
  multiline?: boolean;
  maxLength?: number;
}

export function TextField({
  label,
  value,
  onChangeText,
  onBlur,
  hint,
  error,
  placeholder,
  keyboardType,
  prefix,
  suffix,
  hideLabel,
  multiline,
  maxLength,
}: TextFieldProps) {
  const colors = useTheme();
  const borderColor = error ? colors.negative : colors.borderStrong;
  const spokenLabel = suffix ? `${label}, ${suffix}` : label;

  return (
    <View style={styles.field}>
      {hideLabel ? null : (
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
      )}
      <View style={[styles.input, { backgroundColor: colors.surface, borderColor }]}>
        {prefix ? <AppText tone="muted">{prefix}</AppText> : null}
        <TextInput
          accessibilityLabel={spokenLabel}
          accessibilityHint={error ?? hint}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          cursorColor={colors.primary}
          selectionColor={colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
          style={[styles.textInput, { color: colors.text }]}
        />
        {suffix ? <AppText tone="muted">{suffix}</AppText> : null}
      </View>
      {error ? (
        <AppText variant="caption" tone="negative" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
      {hint && !error ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const DEFAULT_DECIMALS = 2;
const DURATION_LENGTH = 5;
const DURATION_PLACEHOLDER = '08:00';

type NumericFieldProps = Omit<TextFieldProps, 'keyboardType' | 'maxLength'>;

export function NumberField({ decimals = DEFAULT_DECIMALS, onChangeText, ...props }: NumericFieldProps & { decimals?: number }) {
  const format = useFormat();
  return <TextField keyboardType="decimal-pad" onChangeText={(text) => onChangeText(maskDecimal(text, format.profile.locale, decimals))} {...props} />;
}

export function IntegerField({ maxDigits, onChangeText, ...props }: NumericFieldProps & { maxDigits?: number }) {
  return <TextField keyboardType="number-pad" maxLength={maxDigits} onChangeText={(text) => onChangeText(maskInteger(text, maxDigits))} {...props} />;
}

export function DurationField({ onChangeText, ...props }: NumericFieldProps) {
  return (
    <TextField
      keyboardType="number-pad"
      maxLength={DURATION_LENGTH}
      placeholder={DURATION_PLACEHOLDER}
      onChangeText={(text) => onChangeText(maskDuration(text))}
      {...props}
    />
  );
}

export function MoneyField({ onChangeText, onBlur, ...props }: Omit<NumericFieldProps, 'prefix'>) {
  const format = useFormat();
  const { locale } = format.profile;

  const complete = () => {
    if (props.value.trim()) onChangeText(completeDecimals(props.value, locale, format.moneyDigits));
    onBlur?.();
  };

  return (
    <TextField
      keyboardType="decimal-pad"
      prefix={format.currencySymbol}
      placeholder={format.moneyInput(0)}
      onChangeText={(text) => onChangeText(maskDecimal(text, locale, format.moneyDigits))}
      onBlur={complete}
      {...props}
    />
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
  textInput: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.body, paddingVertical: spacing.sm },
});
