import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemeMode } from '@modules/copilot';
import { palette, radius, spacing, useTheme } from '@shared/theme/theme';
import { AppText, Card, ListRow, Screen } from '@shared/ui/primitives';
import { loadThemeMode, saveThemeMode } from './themePreference';

const MODES: ThemeMode[] = ['system', 'light', 'dark'];
const PREVIEW_HEIGHT = 120;

export default function AppearanceScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { t } = useTranslation('settings');
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    void loadThemeMode().then(setMode);
  }, []);

  const change = (next: ThemeMode) => {
    setMode(next);
    void saveThemeMode(next);
  };

  return (
    <Screen>
      <View accessibilityRole="radiogroup" accessibilityLabel={t('appearance.title')} style={styles.tiles}>
        {MODES.map((value) => {
          const selected = value === mode;
          return (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => change(value)}
              style={[styles.tile, { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border, borderWidth: selected ? 2 : 1 }]}
            >
              <View style={[styles.preview, { borderColor: colors.border }]}>
                {value === 'dark' ? null : <View style={[styles.half, { backgroundColor: palette.light.background }]} />}
                {value === 'light' ? null : <View style={[styles.half, { backgroundColor: palette.dark.background }]} />}
              </View>
              <AppText bold={selected}>{t(`appearance.${value}`)}</AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText tone="muted">{t('appearance.hint')}</AppText>
      <Card>
        <ListRow title={t('appearance.cardTitle')} subtitle={t('appearance.cardSubtitle')} chevron onPress={() => router.push('/copilot')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, borderRadius: radius.md + 2, padding: spacing.sm, gap: spacing.sm, alignItems: 'center' },
  preview: {
    alignSelf: 'stretch',
    height: PREVIEW_HEIGHT,
    borderRadius: radius.sm + 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  half: { flex: 1 },
});
