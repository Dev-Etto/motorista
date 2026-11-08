import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { prepareApp } from '@application/startup';
import { useDeviceLocaleSync } from '@application/useRegional';
import { useFloatingVisibility } from '@features/copilot/useFloatingVisibility';
import { restoreThemeMode } from '@features/settings/themePreference';
import { useRescheduleOnLanguageChange } from '@features/settings/useRescheduleOnLanguageChange';
import { shiftStatusNow } from '@features/shifts';
import '@features/shifts/gpsTask';
import { fonts, useTheme } from '@shared/theme/theme';
import { AppSplash, keepNativeSplash } from '@shared/ui/AppSplash';
import { DialogHost } from '@shared/ui/DialogHost';
import { Notice, Screen } from '@shared/ui/primitives';
import { ThemedStatusBar } from '@shared/ui/ThemedStatusBar';
import { ToastHost } from '@shared/ui/ToastHost';
import { reportError } from '@shared/utils/reportError';

keepNativeSplash();

const SCREENS = [
  { name: 'vehicles', titleKey: 'screens.vehicles' },
  { name: 'vehicle', titleKey: 'screens.vehicle' },
  { name: 'goal', titleKey: 'screens.goal' },
  { name: 'copilot', titleKey: 'screens.copilot' },
  { name: 'offers', titleKey: 'screens.offers' },
  { name: 'calculator', titleKey: 'screens.calculator' },
  { name: 'copilot-setup', titleKey: 'screens.copilotSetup' },
  { name: 'copilot-card', titleKey: 'screens.copilotCard' },
  { name: 'copilot-reading', titleKey: 'screens.copilotReading' },
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
  { name: 'privacy-choices', titleKey: 'screens.privacyChoices' },
  { name: 'terms', titleKey: 'screens.terms' },
  { name: 'about', titleKey: 'screens.about' },
  { name: 'appearance', titleKey: 'screens.appearance' },
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
      } catch (error) {
        reportError(error);
        setState('failed');
      }
    }
  }, [router]);

  return state;
}

export default function RootLayout() {
  const state = useAppBootstrap();
  const [splashDone, setSplashDone] = useState(false);
  const [splashShift] = useState(shiftStatusNow);
  const finishSplash = useCallback(() => setSplashDone(true), []);
  useFloatingVisibility();
  useDeviceLocaleSync();
  useRescheduleOnLanguageChange();

  return (
    <SafeAreaProvider>
      <ThemedStatusBar />
      {state === 'ready' ? <AppStack /> : null}
      {state === 'failed' ? <OpenFailed /> : null}
      {splashDone ? null : <AppSplash ready={state !== 'loading'} shift={splashShift} onDone={finishSplash} />}
    </SafeAreaProvider>
  );
}

function OpenFailed() {
  const { t } = useTranslation();
  return (
    <Screen safeTop>
      <Notice tone="negative" message={t('app.openFailed')} />
    </Screen>
  );
}

function AppStack() {
  const colors = useTheme();
  const { t } = useTranslation();
  return (
    <>
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
      <ToastHost />
    </>
  );
}
