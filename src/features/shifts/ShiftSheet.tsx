import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isShiftForgotten } from '@domain/shift/forgotten';
import { useFormat } from '@shared/i18n/format';
import { radius, spacing, useTheme } from '@shared/theme/theme';
import { AppText, Button, ButtonRow, ListRow, Notice, ToggleRow } from '@shared/ui/primitives';
import { clockOfMillis, formatClock } from '@shared/utils/dates';
import { reportError } from '@shared/utils/reportError';
import type { LiveTrackingState } from './useLiveTracking';

const HANDLE = { width: 40, height: 4 };

export function ShiftSheet({ live, visible, onClose }: { live: LiveTrackingState; visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const format = useFormat();
  const { t } = useTranslation('shifts');
  const run = (action: () => Promise<void>) => () => action().catch(reportError);
  const go = (navigate: () => void) => () => {
    onClose();
    navigate();
  };
  const startedAt = clockOfMillis(live.startedAt);
  const measured = live.km > 0 ? t('sheet.measured', { context: format.distanceUnit, distance: format.distance(live.km) }) : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('sheet.close')}
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: colors.backdrop }]}
      />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <AppText tone="muted">{live.running ? t('sheet.since', { time: startedAt }) : t('sheet.pausedAt', { time: startedAt })}</AppText>
        <AppText variant="display" bold accessibilityRole="header">
          {formatClock(live.elapsedMs)}
        </AppText>
        {measured ? <AppText tone="muted">{measured}</AppText> : null}
        {isShiftForgotten(live.started, live.elapsedMs) ? <Notice message={t('active.forgotten')} /> : null}
        <ButtonRow>
          <Button label={live.running ? t('bar.pause') : t('bar.resume')} variant="secondary" onPress={run(live.running ? live.pause : live.start)} />
          <Button label={t('bar.finish')} onPress={go(() => router.push({ pathname: '/shift/new', params: { finish: '1' } }))} />
        </ButtonRow>
        <View>
          <ListRow icon="fuel" title={t('sheet.fuel')} chevron onPress={go(() => router.push({ pathname: '/expense/new', params: { category: 'fuel' } }))} />
          <ListRow
            icon="document"
            title={t('sheet.expense')}
            chevron
            onPress={go(() => router.push({ pathname: '/expense/new', params: { category: 'other' } }))}
          />
          <ToggleRow
            label={t('live.measureKm', { context: format.distanceUnit })}
            value={live.measureKm}
            onChange={(value) => live.toggleMeasureKm(value).catch(reportError)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radius.lg + spacing.sm,
    borderTopRightRadius: radius.lg + spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  handle: { alignSelf: 'center', width: HANDLE.width, height: HANDLE.height, borderRadius: radius.pill, marginBottom: spacing.sm },
});
