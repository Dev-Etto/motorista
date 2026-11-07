import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MIN_TOUCH_TARGET, spacing, useTheme } from '@shared/theme/theme';
import { AppIcon } from './AppIcon';
import { AppText } from './primitives';

export function LearnMore({ title, children }: { title: string; children: ReactNode }) {
  const colors = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((current) => !current)} style={styles.row}>
        <AppIcon name="help" color={colors.accent} size={20} />
        <AppText variant="caption" tone="accent" bold style={styles.title}>
          {title}
        </AppText>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH_TARGET },
  title: { flex: 1 },
  body: { gap: spacing.sm },
});
