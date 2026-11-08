import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useFormat } from '@shared/i18n/format';
import { radius, spacing, useTheme } from '@shared/theme/theme';
import { AppIcon, AppIconName } from '@shared/ui/AppIcon';
import { Illustration, IllustrationName } from '@shared/ui/illustrations/Illustration';
import { Card } from './layout';
import { AppText, Tone, TONE_COLORS } from './text';

const SEGMENTS = 12;

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
  inverse: 'help',
  inverseMuted: 'help',
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
  progress: { flexDirection: 'row', gap: spacing.xs },
  progressSegment: { flex: 1, height: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  dotActive: { width: 24 },
  empty: { alignItems: 'center', gap: spacing.md },
  stretch: { alignSelf: 'stretch' },
  emptyIcon: { width: 56, height: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderRadius: radius.md, padding: spacing.md },
});
