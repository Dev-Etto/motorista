import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, useTheme } from '@/shared/theme/theme';

const PLATFORM_STYLES: Record<string, { background: string; text: string }> = {
  Uber: { background: '#000000', text: '#FFFFFF' },
  '99': { background: '#FFDD00', text: '#111111' },
  inDrive: { background: '#C1F11D', text: '#111111' },
};

export function PlatformBadge({ name }: { name: string }) {
  const colors = useTheme();
  const style = PLATFORM_STYLES[name] ?? { background: colors.surfaceAlt, text: colors.text };

  return (
    <View style={[styles.badge, { backgroundColor: style.background }]}>
      <Text numberOfLines={1} style={[styles.label, { color: style.text }]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  label: { fontSize: 13, fontWeight: '700' },
});
