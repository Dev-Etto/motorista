import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { prepareApp } from '@application/startup';
import { useDeviceLocaleSync } from '@application/useRegional';
import { useFloatingVisibility } from '@features/copilot/useFloatingVisibility';
import { restoreThemeMode } from '@features/settings/themePreference';
import { useRescheduleOnLanguageChange } from '@features/settings/useRescheduleOnLanguageChange';
import '@features/shifts/gpsTask';
import { fonts, useTheme } from '@shared/theme/theme';
import { DialogHost } from '@shared/ui/DialogHost';
import { AppText, Notice, Screen } from '@shared/ui/primitives';
import { ThemedStatusBar } from '@shared/ui/ThemedStatusBar';

const SCREENS = [
  { name: 'vehicles', titleKey: 'screens.vehicles' },
  { name: 'vehicle', titleKey: 'screens.vehicle' },
  { name: 'goal', titleKey: 'screens.goal' },
  { name: 'copilot', titleKey: 'screens.copilot' },
  { name: 'offers', titleKey: 'screens.offers' },
  { name: 'calculator', titleKey: 'screens.calculator' },
  { name: 'copilot-setup', titleKey: 'screens.copilotSetup' },
  { name: 'help', titleKey: 'screens.help' },
  { name: 'permissions', titleKey: 'screens.permissions' },
  { name: 'summary', titleKey: 'screens.summary' },
  { name: 'platforms', titleKey: 'screens.platforms' },
  { name: 'reminders', titleKey: 'screens.reminders' },
  { name: 'region', titleKey: 'screens.region' },
  { name: 'region-language', titleKey: 'screens.regionLanguage' },
  { name: 'region-format', titleKey: 'screens.regionFormat' },
  { name: 'backup', titleKey: 'screens.backup' },
  { name: 'report', titleKey: 'screens.report' },
  { name: 'privacy', titleKey: 'screens.privacy' },
  { name: 'terms', titleKey: 'screens.terms' },
  { name: 'about', titleKey: 'screens.about' },
  { name: 'shift/new', titleKey: 'screens.shiftNew' },
  { name: 'shift/[id]', titleKey: 'screens.shiftDetail' },
  { name: 'expense/new', titleKey: 'screens.expenseNew' },
] as const;

function useAppBootstrap() {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    void bootstrap();

    async function bootstrap() {
      try {
        const { onboarded } = await prepareApp(restoreThemeMode);
        setState('ready');
        if (!onboarded) setTimeout(() => router.replace('/onboarding'));
      } catch {
        setState('failed');
      }
    }
  }, [router]);

  return state;
}

export default function RootLayout() {
  const colors = useTheme();
  const state = useAppBootstrap();
  const { t } = useTranslation();
  useFloatingVisibility();
  useDeviceLocaleSync();
  useRescheduleOnLanguageChange();

  if (state === 'failed') {
    return (
      <SafeAreaProvider>
        <ThemedStatusBar />
        <Screen safeTop>
          <Notice tone="negative" message={t('app.openFailed')} />
        </Screen>
      </SafeAreaProvider>
    );
  }
  if (state === 'loading') {
    return (
      <SafeAreaProvider>
        <ThemedStatusBar />
        <Screen safeTop>
          <AppText tone="muted">{t('app.loading')}</AppText>
        </Screen>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemedStatusBar />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.bold },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        {SCREENS.map((screen) => (
          <Stack.Screen key={screen.name} name={screen.name} options={{ title: t(screen.titleKey) }} />
        ))}
      </Stack>
      <DialogHost />
    </SafeAreaProvider>
  );
}
