import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { palette } from '@shared/theme/theme';

export const SPLASH_ICON_SIZE = 220;
const VIEW_BOX = 512;
const MARK_SCALE = 3;
const MARK_CENTER = { x: 60.5, y: 58.5 };
const STROKE = 12;
const DOT = { x: 92, y: 30, r: 7 };
const BACKGROUND = palette.light.primary;
const INK = palette.light.surface;
export type SplashShift = 'idle' | 'running' | 'paused';

const LIGHTS: Record<SplashShift, string | null> = {
  idle: null,
  running: palette.dark.shiftRunning,
  paused: palette.dark.shiftPaused,
};
const LIGHT_MS = 260;
const HOLD_MS = 140;
const EXIT_MS = 320;
const REDUCED_EXIT_MS = 160;
const EXIT_SCALE = 1.12;
const DOT_PEAK_SCALE = 1.6;
const LIGHT_COVERED = 0.95;

const toIcon = (value: number, center: number) => ((VIEW_BOX / 2 + (value - center) * MARK_SCALE) * SPLASH_ICON_SIZE) / VIEW_BOX;
const DOT_SIZE = (DOT.r * 2 * MARK_SCALE * SPLASH_ICON_SIZE) / VIEW_BOX;
const DOT_FRAME = {
  left: toIcon(DOT.x, MARK_CENTER.x) - DOT_SIZE / 2,
  top: toIcon(DOT.y, MARK_CENTER.y) - DOT_SIZE / 2,
  width: DOT_SIZE,
  height: DOT_SIZE,
  borderRadius: DOT_SIZE / 2,
};
const MARK_TRANSFORM = `translate(${VIEW_BOX / 2} ${VIEW_BOX / 2}) scale(${MARK_SCALE}) translate(${-MARK_CENTER.x} ${-MARK_CENTER.y})`;

export function AppSplash({ ready, shift = 'idle', onDone }: { ready: boolean; shift?: SplashShift; onDone: () => void }) {
  const light = LIGHTS[shift];
  const [lit] = useState(() => new Animated.Value(0));
  const [exit] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!ready) return;
    void play();

    async function play() {
      const reduced = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      const fadeOut = Animated.timing(exit, {
        toValue: 1,
        duration: reduced ? REDUCED_EXIT_MS : EXIT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      });
      const lightUp = Animated.timing(lit, { toValue: 1, duration: LIGHT_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true });
      Animated.sequence(reduced || !light ? [fadeOut] : [lightUp, Animated.delay(HOLD_MS), fadeOut]).start(onDone);
    }
  }, [ready, light, lit, exit, onDone]);

  const hideNativeSplash = () => void SplashScreen.hideAsync().catch(() => undefined);
  const opacity = exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const markScale = exit.interpolate({ inputRange: [0, 1], outputRange: [1, EXIT_SCALE] });
  const dotScale = lit.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, DOT_PEAK_SCALE, 1] });
  const lightFill = lit.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const inkOpacity = lit.interpolate({ inputRange: [0, LIGHT_COVERED, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      testID="app-splash"
      pointerEvents={ready ? 'none' : 'auto'}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      onLayout={hideNativeSplash}
      style={[StyleSheet.absoluteFill, styles.backdrop, { opacity }]}
    >
      <Animated.View style={[styles.icon, { transform: [{ scale: markScale }] }]}>
        <Svg width={SPLASH_ICON_SIZE} height={SPLASH_ICON_SIZE} viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}>
          <G transform={MARK_TRANSFORM}>
            <Path
              d="M28 88V56a14 14 0 0 1 28 0v12M56 56a14 14 0 0 1 28 0v32"
              fill="none"
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path d="M56 82v6" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
          </G>
        </Svg>
        <Animated.View style={[styles.dot, DOT_FRAME, { transform: [{ scale: dotScale }] }]}>
          <Animated.View style={[styles.dotLayer, { borderRadius: DOT_FRAME.borderRadius, backgroundColor: INK, opacity: inkOpacity }]} />
          <Animated.View
            style={[styles.dotLayer, { borderRadius: DOT_FRAME.borderRadius, backgroundColor: light ?? INK, transform: [{ scale: lightFill }] }]}
            testID="splash-light"
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: BACKGROUND, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  icon: { width: SPLASH_ICON_SIZE, height: SPLASH_ICON_SIZE },
  dot: { position: 'absolute' },
  dotLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});

export function keepNativeSplash() {
  void SplashScreen.preventAutoHideAsync().catch(() => undefined);
}
