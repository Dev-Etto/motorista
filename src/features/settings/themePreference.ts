import { copilot, type ThemeMode } from '@modules/copilot';
import { THEME_MODES } from '@modules/copilot/schemas';
import { Appearance } from 'react-native';
import { SETTING_KEYS, settingsRepository } from '@/data/repositories/settingsRepository';

function applyThemeMode(mode: ThemeMode) {
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
  copilot.setPreferences({ ...copilot.getPreferences(), theme: mode });
}

export async function loadThemeMode(): Promise<ThemeMode> {
  return settingsRepository.getEnum(SETTING_KEYS.theme, THEME_MODES, 'system');
}

export async function restoreThemeMode(): Promise<void> {
  applyThemeMode(await loadThemeMode());
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  applyThemeMode(mode);
  await settingsRepository.set(SETTING_KEYS.theme, mode);
}
