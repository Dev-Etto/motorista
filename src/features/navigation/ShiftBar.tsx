import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLiveTracking } from '@features/shifts';
import { useFormat } from '@shared/i18n/format';
import { MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@shared/theme/theme';
import { AppText } from '@shared/ui/primitives';
import { formatClock } from '@shared/utils/dates';

const DOT_SIZE = 10;
const ignoreApply = () => undefined;

export function ShiftBar() {
  const router = useRouter();
  const { t } = useTranslation('shifts');
  const format = useFormat();
  const colors = useTheme();
  const live = useLiveTracking(ignoreApply);
  if (!live.started) return null;

  const status = live.running ? t('bar.running') : t('bar.paused');
  const details = [formatClock(live.elapsedMs), live.km > 0 ? format.distance(live.km) : null].filter(Boolean).join(' · ');

  return (
    <View style={[styles.bar, { backgroundColor: colors.surfaceAlt, borderTopColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${status}, ${details}`}
        accessibilityHint={t('bar.openHint')}
        onPress={() => router.push('/shift/new')}
        style={styles.info}
      >
        <View style={[styles.dot, { backgroundColor: live.running ? colors.positive : colors.warning }]} />
        <View>
          <AppText variant="caption" tone="muted">
            {status}
          </AppText>
          <AppText bold>{details}</AppText>
        </View>
      </Pressable>
      <BarButton label={live.running ? t('bar.pause') : t('bar.resume')} onPress={live.running ? live.pause : live.start} />
      <BarButton label={t('bar.finish')} primary onPress={() => router.push({ pathname: '/shift/new', params: { finish: '1' } })} />
    </View>
  );
}

function BarButton({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  const colors = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.button, { backgroundColor: primary ? colors.primary : colors.surface, borderColor: colors.border }]}
    >
      <AppText bold style={{ color: primary ? colors.onPrimary : colors.text }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH_TARGET },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: radius.pill },
  button: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
