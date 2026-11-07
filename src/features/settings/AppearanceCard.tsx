import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeMode } from '@modules/copilot';
import { Card, Segmented } from '@shared/ui/primitives';
import { loadThemeMode, saveThemeMode } from './themePreference';

const MODES: ThemeMode[] = ['system', 'light', 'dark'];

export function AppearanceCard() {
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
    <Card title={t('appearance.title')}>
      <Segmented value={mode} options={options} onChange={change} />
    </Card>
  );
}
