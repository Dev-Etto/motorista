import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '@shared/theme/theme';
import { AppText } from './primitives';

export function StatTile({ label, value }: { label: string; value: string }) {
  const colors = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}, ${value}`} style={[styles.tile, { backgroundColor: colors.surface, boxShadow: colors.cardShadow }]}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="subtitle" bold numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
    </View>
  );
}

export function StatTiles({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, borderRadius: radius.md, padding: spacing.md, gap: 2 },
});
