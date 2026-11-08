import { StyleSheet, Text, View } from 'react-native';
import { fonts, radius, useTheme } from '@shared/theme/theme';

const PLATFORM_STYLES: Record<string, { background: string; text: string }> = {
  Uber: { background: '#000000', text: '#FFFFFF' },
  '99': { background: '#FFDD00', text: '#111111' },
  inDrive: { background: '#C1F11D', text: '#111111' },
};

export const PLATFORM_BADGE_SIZE = { width: 78, height: 32 };
const LABEL_SIZE = 15;
const MIN_LABEL_SCALE = 0.6;
const LABEL_PADDING = 6;

export function PlatformBadge({ name }: { name: string }) {
  const colors = useTheme();
  const style = PLATFORM_STYLES[name] ?? { background: colors.surfaceAlt, text: colors.text };

  return (
    <View style={[styles.badge, { backgroundColor: style.background }]}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={MIN_LABEL_SCALE} maxFontSizeMultiplier={1} style={[styles.label, { color: style.text }]}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: PLATFORM_BADGE_SIZE.width,
    height: PLATFORM_BADGE_SIZE.height,
    borderRadius: radius.sm - 1,
    paddingHorizontal: LABEL_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: LABEL_SIZE, fontFamily: fonts.bold },
});
