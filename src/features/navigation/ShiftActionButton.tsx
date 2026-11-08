import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useLiveTracking } from '@features/shifts';
import { fonts, radius, ThemeColors, useTheme } from '@shared/theme/theme';
import { AppIcon } from '@shared/ui/AppIcon';
import { formatElapsedShort } from '@shared/utils/dates';
import { reportError } from '@shared/utils/reportError';
import { LONG_TIME_LENGTH, ShiftButtonState, shiftButtonState, spokenElapsed } from './shiftButtonState';

export const SHIFT_BUTTON_SIZE = 64;
const TIME_SIZE = 16;
const LONG_TIME_SIZE = 14;
const ICON_SIZE = 24;
const PAUSE_ICON_SIZE = 14;

const ignoreApply = () => undefined;

const FILL: Record<ShiftButtonState, { fill: keyof ThemeColors; ink: keyof ThemeColors }> = {
  idle: { fill: 'primary', ink: 'onPrimary' },
  running: { fill: 'shiftRunning', ink: 'onShiftRunning' },
  paused: { fill: 'shiftPaused', ink: 'onShiftPaused' },
};

export function ShiftButton({ onOpen }: { onOpen: () => void }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const live = useLiveTracking(ignoreApply);
  const state = shiftButtonState(live.started, live.running);
  const ink = colors[FILL[state].ink];
  const time = formatElapsedShort(live.elapsedMs);
  const spoken = spokenElapsed(live.elapsedMs, t);
  const label = state === 'idle' ? t('tabs.shiftButton.start') : t(`tabs.shiftButton.${state}`, { time: spoken });

  const press = () => {
    if (state !== 'idle') return onOpen();
    live.start().catch(reportError);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={press}
      style={({ pressed }) => [styles.button, { backgroundColor: colors[FILL[state].fill], boxShadow: colors.floatingShadow, opacity: pressed ? 0.85 : 1 }]}
    >
      {state === 'idle' ? (
        <AppIcon name="play" color={ink} size={ICON_SIZE} />
      ) : (
        <Text maxFontSizeMultiplier={1} style={[styles.time, { color: ink, fontSize: time.length >= LONG_TIME_LENGTH ? LONG_TIME_SIZE : TIME_SIZE }]}>
          {time}
        </Text>
      )}
      {state === 'paused' ? <AppIcon name="pause" color={ink} size={PAUSE_ICON_SIZE} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SHIFT_BUTTON_SIZE,
    height: SHIFT_BUTTON_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: { fontFamily: fonts.bold, fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
});
