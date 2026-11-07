import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeMode } from '@modules/copilot';
import { AppText, Segmented } from '@shared/ui/primitives';
import { loadThemeMode, saveThemeMode } from './themePreference';

const MODES: ThemeMode[] = ['system', 'light', 'dark'];

export function ThemeChooser() {
  const { t } = useTranslation('settings');
  const [mode, setMode] = useState<ThemeMode>('system');
  const options = MODES.map((value) => ({ value, label: t(`appearance.${value}`) }));

  useEffect(() => {
    void loadThemeMode().then(setMode);
  }, []);

  const change = (next: ThemeMode) => {
    setMode(next);
    void saveThemeMode(next);
  };

  return (
    <>
      <AppText variant="caption" tone="muted">
        {t('appearance.title')}
      </AppText>
      <Segmented value={mode} options={options} onChange={change} />
    </>
  );
}
