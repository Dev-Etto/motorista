import { copilot, ThemeMode } from '@modules/copilot';
import { Appearance } from 'react-native';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';

function applyThemeMode(mode: ThemeMode) {
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
  copilot.setPreferences({ ...copilot.getPreferences(), theme: mode });
}

export async function loadThemeMode(): Promise<ThemeMode> {
  const saved = await settingsRepository.get(SETTING_KEYS.theme);
  return (saved as ThemeMode | null) ?? 'system';
}

export async function restoreThemeMode(): Promise<void> {
  applyThemeMode(await loadThemeMode());
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  applyThemeMode(mode);
  await settingsRepository.set(SETTING_KEYS.theme, mode);
}
