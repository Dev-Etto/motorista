import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BackupScreen from '@features/settings/BackupScreen';

const DAY = 86_400_000;
const NOW = new Date(2026, 10, 7, 12).getTime();
const mockBackup = {
  lastBackupAt: null as string | null,
  loadedAt: NOW,
  canUndo: false,
  busy: false,
  message: null,
  exportBackup: jest.fn(),
  importBackup: jest.fn(),
};

jest.mock('@features/settings/useBackup', () => ({ useBackup: () => mockBackup }));
jest.mock('@features/tips', () => ({ TipBanner: () => null }));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <BackupScreen />
    </SafeAreaProvider>,
  );

describe('Backup', () => {
  it('com backup recente, mostra dados protegidos', async () => {
    mockBackup.lastBackupAt = String(NOW - DAY);
    await renderScreen();

    expect(screen.getByRole('header', { name: 'Dados protegidos' })).toBeTruthy();
  });

  it('sem backup, pede para fazer um', async () => {
    mockBackup.lastBackupAt = null;
    await renderScreen();

    expect(screen.getByRole('header', { name: 'Faça um backup' })).toBeTruthy();
    expect(screen.getByText('Último backup: Nunca')).toBeTruthy();
  });
});
