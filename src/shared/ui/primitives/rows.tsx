import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@shared/theme/theme';
import { AppIcon, AppIconName } from '@shared/ui/AppIcon';
import { AppText, Tone } from './text';

interface ToggleRowProps {
  label: string;
  hint?: string;
  hintTone?: Tone;
  leading?: ReactNode;
  value: boolean;
  onChange: (next: boolean) => void;
}

export function ToggleRow({ label, hint, hintTone = 'muted', leading, value, onChange }: ToggleRowProps) {
  const colors = useTheme();
  return (
    <View style={styles.rowBetween}>
      {leading}
      <View style={styles.flex}>
        {leading ? null : <AppText>{label}</AppText>}
        {hint ? (
          <AppText variant="caption" tone={hintTone} bold={hintTone !== 'muted'}>
            {hint}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.borderStrong, true: colors.primary }}
        thumbColor={value ? colors.onPrimary : colors.switchThumbOff}
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH_TARGET },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET + spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBadge: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
