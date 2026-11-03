import { ThemeMode } from '@modules/copilot';
import { useEffect, useState } from 'react';
import { Card, Segmented } from '@/shared/ui/primitives';
import { loadThemeMode, saveThemeMode } from './themePreference';

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Automático' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

export function AppearanceCard() {
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    void loadThemeMode().then(setMode);
  }, []);

  const change = (next: ThemeMode) => {
    setMode(next);
    void saveThemeMode(next);
  };

  return (
    <Card title="Tema">
      <Segmented value={mode} options={OPTIONS} onChange={change} />
    </Card>
  );
}
