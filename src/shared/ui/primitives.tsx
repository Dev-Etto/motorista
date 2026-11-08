import { Children, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Switch, Text, TextProps, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFormat } from '@shared/i18n/format';
import { fonts, fontSize, MIN_TOUCH_TARGET, radius, spacing, ThemeColors, useTheme } from '@shared/theme/theme';
import { AppIcon, AppIconName } from './AppIcon';
import { Illustration, IllustrationName } from './illustrations/Illustration';

type Tone = 'default' | 'muted' | 'positive' | 'warning' | 'negative' | 'accent';
type Variant = 'caption' | 'body' | 'subtitle' | 'title' | 'display';

const TABULAR: ['tabular-nums'] = ['tabular-nums'];
const SEGMENTS = 12;

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
  const textStyle = {
    color: colors[TONE_COLORS[tone]],
    fontSize: fontSize[variant],
    fontFamily: bold ? fonts.bold : fonts.regular,
    fontVariant: TABULAR,
    textAlign: center ? 'center' : 'auto',
  } as const;
  return <Text style={[textStyle, style]} {...props} />;
}

export function Screen({
  children,
  scroll = true,
  safeTop = false,
  centered = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  safeTop?: boolean;
  centered?: boolean;
}) {
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
    <View style={[styles.card, { backgroundColor: colors.surface, boxShadow: colors.cardShadow }]}>
      {title ? (
        <AppText variant="subtitle" bold accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
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
  accessibilityLabel?: string;
}

export function Button({ label, onPress, variant = 'primary', disabled, busy, accessibilityLabel }: ButtonProps) {
  const colors = useTheme();
  const inactive = Boolean(disabled || busy);
  const isPrimary = variant === 'primary';
  const labelColor = isPrimary ? colors.onPrimary : variant === 'danger' ? colors.negative : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
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
      <Text style={{ color: labelColor, fontSize: fontSize.body, fontFamily: fonts.bold }}>{label}</Text>
    </Pressable>
  );
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return (
    <View style={styles.buttonRow}>
      {Children.toArray(children).map((child, index) => (
        <View key={index} style={styles.flex}>
          {child}
        </View>
      ))}
    </View>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label?: string;
}

export function Segmented<T extends string>({ value, options, onChange, label }: SegmentedProps<T>) {
  const colors = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.segmented, { backgroundColor: colors.surfaceAlt }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: selected ? colors.onPrimary : colors.text, fontFamily: fonts.semibold, textAlign: 'center' }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (next: boolean) => void }) {
  const colors = useTheme();
  return (
    <View style={styles.rowBetween}>
      <View style={styles.flex}>
        <AppText>{label}</AppText>
        {hint ? (
          <AppText variant="caption" tone="muted">
            {hint}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.borderStrong, true: colors.primary }}
        thumbColor={value ? colors.onPrimary : colors.textMuted}
      />
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
  selected?: boolean;
  chevron?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

function rowRole(selected: boolean | undefined, onPress: (() => void) | undefined) {
  if (selected !== undefined) return 'radio';
  return onPress ? 'button' : undefined;
}

export function ListRow({ icon, leading, title, subtitle, value, valueTone = 'default', selected, chevron, onPress, accessibilityLabel }: ListRowProps) {
  const colors = useTheme();
  const role = rowRole(selected, onPress);
  const readOnlyLabel = role ? accessibilityLabel : (accessibilityLabel ?? [title, subtitle, value].filter(Boolean).join(', '));
  return (
    <Pressable
      accessible
      accessibilityRole={role}
      accessibilityLabel={readOnlyLabel}
      accessibilityState={selected === undefined ? undefined : { checked: selected }}
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
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText bold tone={valueTone}>
          {value}
        </AppText>
      ) : null}
      {selected ? <AppIcon name="check" color={colors.primary} size={22} /> : null}
      {chevron ? <AppIcon name="chevron" color={colors.textMuted} size={20} /> : null}
    </Pressable>
  );
}

interface CollapsibleProps {
  title: string;
  children: ReactNode;
  initiallyOpen?: boolean;
  forceOpen?: boolean;
}

export function Collapsible({ title, children, initiallyOpen = false, forceOpen = false }: CollapsibleProps) {
  const colors = useTheme();
  const [toggled, setOpen] = useState(initiallyOpen);
  const open = toggled || forceOpen;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, boxShadow: colors.cardShadow }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((current) => !current)} style={styles.rowBetween}>
        <AppText variant="subtitle" bold style={styles.flex} accessibilityRole="header">
          {title}
        </AppText>
        <AppText variant="subtitle" tone="muted" importantForAccessibility="no" accessibilityElementsHidden>
          {open ? '−' : '+'}
        </AppText>
      </Pressable>
      {open ? children : null}
    </View>
  );
}

export function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: Tone }) {
  return (
    <View style={styles.stat}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="subtitle" bold tone={tone}>
        {value}
      </AppText>
    </View>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <View style={styles.statGrid}>{children}</View>;
}

export function ProgressBar({ progress }: { progress: number }) {
  const colors = useTheme();
  const format = useFormat();
  const { t } = useTranslation();
  const clamped = Math.max(0, Math.min(1, progress));
  const filled = clamped > 0 ? Math.max(1, Math.round(clamped * SEGMENTS)) : 0;
  return (
    <View accessible accessibilityLabel={t('progressBar.label', { percent: format.percent(Math.round(clamped * 100)) })} style={styles.progress}>
      {Array.from({ length: SEGMENTS }, (_, index) => (
        <View key={index} style={[styles.progressSegment, { backgroundColor: index < filled ? colors.primary : colors.surfaceAlt }]} />
      ))}
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
  illustration?: IllustrationName;
  icon?: AppIconName;
}

export function EmptyState({ title, message, action, illustration, icon }: EmptyStateProps) {
  const colors = useTheme();
  return (
    <Card>
      <View style={styles.empty}>
        {illustration ? (
          <View style={styles.stretch}>
            <Illustration name={illustration} height={100} />
          </View>
        ) : null}
        {icon ? (
          <View testID="empty-state-icon" style={[styles.emptyIcon, { backgroundColor: colors.surfaceAlt }]}>
            <AppIcon name={icon} color={colors.textMuted} size={28} />
          </View>
        ) : null}
        <AppText variant="subtitle" bold center accessibilityRole="header">
          {title}
        </AppText>
        <AppText tone="muted" center>
          {message}
        </AppText>
      </View>
      {action}
    </Card>
  );
}

export function StepDots({ total, current }: { total: number; current: number }) {
  const colors = useTheme();
  const { t } = useTranslation();
  return (
    <View accessible accessibilityLabel={t('stepDots.label', { current: current + 1, total })} style={styles.dots}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, { backgroundColor: index === current ? colors.primary : colors.border }, index === current && styles.dotActive]}
        />
      ))}
    </View>
  );
}

const NOTICE_ICONS: Record<Tone, AppIconName> = {
  default: 'help',
  muted: 'help',
  accent: 'help',
  positive: 'check',
  warning: 'alert',
  negative: 'alert',
};

const NOTICE_LIVE_REGIONS: Partial<Record<Tone, 'polite' | 'assertive'>> = { negative: 'assertive', warning: 'polite' };

export function Notice({ message, tone = 'warning' }: { message: string; tone?: Tone }) {
  const colors = useTheme();
  const liveRegion = NOTICE_LIVE_REGIONS[tone];
  return (
    <View
      accessible
      accessibilityRole={liveRegion ? 'alert' : undefined}
      accessibilityLiveRegion={liveRegion ?? 'none'}
      style={[styles.notice, { backgroundColor: colors.surfaceAlt }]}
    >
      <AppIcon name={NOTICE_ICONS[tone]} color={colors[TONE_COLORS[tone]]} size={20} />
      <AppText variant="caption" style={styles.flex}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
  centered: { justifyContent: 'center' },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  button: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: spacing.xs, gap: spacing.xs },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH_TARGET },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET + spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stat: { flexBasis: '45%', flexGrow: 1, gap: 2 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  progress: { flexDirection: 'row', gap: spacing.xs },
  progressSegment: { flex: 1, height: 8 },
  iconBadge: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  dotActive: { width: 24 },
  empty: { alignItems: 'center', gap: spacing.md },
  stretch: { alignSelf: 'stretch' },
  emptyIcon: { width: 56, height: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderRadius: radius.md, padding: spacing.md },
});
