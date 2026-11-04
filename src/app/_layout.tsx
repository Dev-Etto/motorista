import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrate } from '@/data/database/connection';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';
import { syncCopilotTargets } from '@/features/copilot/syncTargets';
import { useFloatingVisibility } from '@/features/copilot/useFloatingVisibility';
import { restoreThemeMode } from '@/features/settings/themePreference';
import '@/features/shifts/gpsTask';
import { useTheme } from '@/shared/theme/theme';
import { ThemedStatusBar } from '@/shared/ui/ThemedStatusBar';
import { AppText, Notice, Screen } from '@/shared/ui/primitives';

const SCREEN_TITLES: Record<string, string> = {
  vehicle: 'Veículo e custos',
  goal: 'Meta do mês',
  copilot: 'Copiloto de ofertas',
  'copilot-setup': 'Configurar o Copiloto',
  help: 'Ajuda',
  permissions: 'Permissões',
  summary: 'Meu resumo',
  platforms: 'Plataformas',
  reminders: 'Lembretes',
  backup: 'Backup',
  privacy: 'Privacidade',
  'shift/new': 'Jornada',
  'shift/[id]': 'Detalhes da jornada',
  'expense/new': 'Novo lançamento',
};

function useAppBootstrap() {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    void bootstrap();

    async function bootstrap() {
      try {
        await migrate();
        await syncCopilotTargets();
        await restoreThemeMode();
        const onboarded = await settingsRepository.get(SETTING_KEYS.onboarded);
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
  useFloatingVisibility();

  if (state === 'failed') {
    return (
      <SafeAreaProvider>
        <ThemedStatusBar />
        <Screen safeTop>
          <Notice tone="negative" message="Não foi possível abrir os dados do app. Reinicie e tente novamente." />
        </Screen>
      </SafeAreaProvider>
    );
  }
  if (state === 'loading') {
    return (
      <SafeAreaProvider>
        <ThemedStatusBar />
        <Screen safeTop>
          <AppText tone="muted">Carregando…</AppText>
        </Screen>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemedStatusBar />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        {Object.entries(SCREEN_TITLES).map(([name, title]) => (
          <Stack.Screen key={name} name={name} options={{ title }} />
        ))}
      </Stack>
    </SafeAreaProvider>
  );
}
