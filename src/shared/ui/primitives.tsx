import { Children, ReactNode, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Switch, Text, TextProps, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, MIN_TOUCH_TARGET, radius, spacing, ThemeColors, useTheme } from '@/shared/theme/theme';
import { AppIcon, AppIconName } from './AppIcon';
import { Illustration, IllustrationName } from './illustrations/Illustration';

type Tone = 'default' | 'muted' | 'positive' | 'warning' | 'negative' | 'accent';
type Variant = 'caption' | 'body' | 'subtitle' | 'title' | 'display';

const TONE_COLORS: Record<Tone, keyof ThemeColors> = {
  default: 'text',
  muted: 'textMuted',
  positive: 'positive',
  warning: 'warning',
  negative: 'negative',
  accent: 'accent',
};

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  bold?: boolean;
  center?: boolean;
}

export function AppText({ variant = 'body', tone = 'default', bold, center, style, ...props }: AppTextProps) {
  const colors = useTheme();
  const textStyle = { color: colors[TONE_COLORS[tone]], fontSize: fontSize[variant], fontWeight: bold ? '700' : '400', textAlign: center ? 'center' : 'auto' } as const;
  return <Text style={[textStyle, style]} {...props} />;
}

export function Screen({ children, scroll = true, safeTop = false, centered = false }: { children: ReactNode; scroll?: boolean; safeTop?: boolean; centered?: boolean }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const padding = { paddingBottom: insets.bottom + spacing.xxl, paddingTop: safeTop ? insets.top + spacing.lg : spacing.lg };

  if (!scroll) return <View style={[styles.screen, padding, { backgroundColor: colors.background }]}>{children}</View>;

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.screen, padding, centered && styles.centered]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Card({ children, title }: { children: ReactNode; title?: string }) {
  const colors = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {title ? <AppText variant="subtitle" bold>{title}</AppText> : null}
      {children}
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  busy?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled, busy }: ButtonProps) {
  const colors = useTheme();
  const inactive = Boolean(disabled || busy);
  const isPrimary = variant === 'primary';
  const labelColor = isPrimary ? colors.onPrimary : variant === 'danger' ? colors.negative : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: Boolean(busy) }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? colors.primary : colors.surfaceAlt,
          opacity: inactive ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={{ color: labelColor, fontSize: fontSize.body, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return (
    <View style={styles.buttonRow}>
      {Children.toArray(children).map((child, index) => (
        <View key={index} style={styles.flex}>{child}</View>
      ))}
    </View>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  const colors = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: selected ? colors.onPrimary : colors.text, fontWeight: '600', textAlign: 'center' }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (next: boolean) => void }) {
  return (
    <View style={styles.rowBetween}>
      <View style={styles.flex}>
        <AppText>{label}</AppText>
        {hint ? <AppText variant="caption" tone="muted">{hint}</AppText> : null}
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} />
    </View>
  );
}

interface ListRowProps {
  icon?: AppIconName;
  leading?: ReactNode;
  title?: string;
  subtitle?: string;
  value?: string;
  valueTone?: Tone;
  onPress?: () => void;
}

export function ListRow({ icon, leading, title, subtitle, value, valueTone = 'default', onPress }: ListRowProps) {
  const colors = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.listRow, { borderBottomColor: colors.border }]}
    >
      {icon ? (
        <View style={[styles.iconBadge, { backgroundColor: colors.surfaceAlt }]}>
          <AppIcon name={icon} color={colors.primary} size={22} />
        </View>
      ) : null}
      {leading ? <View>{leading}</View> : null}
      <View style={styles.flex}>
        {title ? <AppText>{title}</AppText> : null}
        {subtitle ? <AppText variant="caption" tone="muted">{subtitle}</AppText> : null}
      </View>
      {value ? <AppText bold tone={valueTone}>{value}</AppText> : null}
    </Pressable>
  );
}

export function Collapsible({ title, children, initiallyOpen = false }: { title: string; children: ReactNode; initiallyOpen?: boolean }) {
  const colors = useTheme();
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={styles.rowBetween}
      >
        <AppText variant="subtitle" bold style={styles.flex}>{title}</AppText>
        <AppText variant="subtitle" tone="muted">{open ? '−' : '+'}</AppText>
      </Pressable>
      {open ? children : null}
    </View>
  );
}

export function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: Tone }) {
  return (
    <View style={styles.stat}>
      <AppText variant="caption" tone="muted">{label}</AppText>
      <AppText variant="subtitle" bold tone={tone}>{value}</AppText>
    </View>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <View style={styles.statGrid}>{children}</View>;
}

export function ProgressBar({ progress }: { progress: number }) {
  const colors = useTheme();
  const width = `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` as const;
  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
      <View style={[styles.progressFill, { backgroundColor: colors.primary, width }]} />
    </View>
  );
}

export function EmptyState({ title, message, action, illustration }: { title: string; message: string; action?: ReactNode; illustration?: IllustrationName }) {
  return (
    <Card>
      {illustration ? <Illustration name={illustration} height={100} /> : null}
      <AppText variant="subtitle" bold>{title}</AppText>
      <AppText tone="muted">{message}</AppText>
      {action}
    </Card>
  );
}

export function StepDots({ total, current }: { total: number; current: number }) {
  const colors = useTheme();
  return (
    <View accessibilityLabel={`Passo ${current + 1} de ${total}`} style={styles.dots}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, { backgroundColor: index === current ? colors.primary : colors.border }, index === current && styles.dotActive]}
        />
      ))}
    </View>
  );
}

export function Notice({ message, tone = 'warning' }: { message: string; tone?: Tone }) {
  const colors = useTheme();
  return (
    <View style={[styles.notice, { borderLeftColor: colors[TONE_COLORS[tone]], backgroundColor: colors.surfaceAlt }]}>
      <AppText variant="caption">{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
  centered: { justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  button: { minHeight: MIN_TOUCH_TARGET, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: spacing.xs, gap: spacing.xs },
  segment: { flex: 1, minHeight: MIN_TOUCH_TARGET - spacing.sm, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH_TARGET },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH_TARGET + spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  stat: { flexBasis: '45%', flexGrow: 1, gap: 2 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  progressTrack: { height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill },
  iconBadge: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  dotActive: { width: 24 },
  notice: { borderLeftWidth: 4, borderRadius: radius.sm, padding: spacing.md },
});
