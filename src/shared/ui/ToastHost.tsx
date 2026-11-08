import { useEffect, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MIN_TOUCH_TARGET, radius, spacing, useTheme } from '@shared/theme/theme';
import { reportError } from '@shared/utils/reportError';
import { AppText } from './primitives';
import { closeToast, currentToast, subscribeToast, Toast } from './toast';

export const TOAST_DURATION_MS = 5000;
const ABOVE_TAB_BAR = 96;
const MAX_WIDTH = 480;

function runAction(toast: Toast) {
  closeToast(toast.id);
  void Promise.resolve(toast.onAction?.()).catch(reportError);
}

export function ToastHost() {
  const toast = useSyncExternalStore(subscribeToast, currentToast);
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    AccessibilityInfo.announceForAccessibility(toast.message);
    const timer = setTimeout(() => closeToast(toast.id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + ABOVE_TAB_BAR }]}>
      <View accessibilityLiveRegion="polite" style={[styles.toast, { backgroundColor: colors.primary }]}>
        <AppText style={[styles.message, { color: colors.onPrimary }]}>{toast.message}</AppText>
        {toast.actionLabel ? (
          <Pressable accessibilityRole="button" onPress={() => runAction(toast)} style={styles.action}>
            <AppText bold style={{ color: colors.onPrimary }}>
              {toast.actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  toast: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    minHeight: MIN_TOUCH_TARGET + spacing.sm,
    borderRadius: radius.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  message: { flex: 1, paddingVertical: spacing.md },
  action: { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
});
