import { Children, ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, useTheme } from '@shared/theme/theme';
import { AppText, Tone } from './text';

const STAT_MIN_FONT_SCALE = 0.75;

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

export function HeroCard({ children, accessibilityLabel }: { children: ReactNode; accessibilityLabel?: string }) {
  const colors = useTheme();
  return (
    <View accessible={Boolean(accessibilityLabel)} accessibilityLabel={accessibilityLabel} style={[styles.hero, { backgroundColor: colors.primary }]}>
      {children}
    </View>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="caption" bold tone="muted" accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </AppText>
      <Card>{children}</Card>
    </View>
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

export function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: Tone }) {
  return (
    <View style={styles.stat}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="subtitle" bold tone={tone} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={STAT_MIN_FONT_SCALE}>
        {value}
      </AppText>
    </View>
  );
}

export function StatGrid({ children, columns }: { children: ReactNode; columns?: number }) {
  if (!columns) return <View style={styles.statGrid}>{children}</View>;

  return (
    <View style={styles.statRow}>
      {Children.toArray(children).map((child, index) => (
        <View key={index} style={styles.flex}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
  centered: { justifyContent: 'center' },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  hero: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  section: { gap: spacing.sm },
  sectionTitle: { paddingHorizontal: spacing.xs },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flexBasis: '45%', flexGrow: 1, gap: 2 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statRow: { flexDirection: 'row', gap: spacing.md },
});
