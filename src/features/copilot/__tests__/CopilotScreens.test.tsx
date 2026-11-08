import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CopilotScreen from '@features/copilot/CopilotScreen';
import CopilotSetupScreen from '@features/copilot/CopilotSetupScreen';

const mockPush = jest.fn();
const mockStatus = {
  enabled: true,
  accessibilityGranted: true,
  overlayGranted: true,
  floatingRunning: true,
  voiceAvailable: true,
  failedReads: 0,
  shortcutEnabled: false,
  batteryRestricted: false,
};
const mockTests = { test: jest.fn(), testOutside: jest.fn(), testNotification: jest.fn() };
const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));
jest.mock('@modules/copilot/platforms', () => ({
  ...jest.requireActual('@modules/copilot/platforms'),
  PLATFORM_PACKAGES: { uber: 'uber', ninetyNine: '99', inDrive: 'indrive' },
}));
jest.mock('@features/copilot/useCopilot', () => ({
  useCopilot: () => ({
    message: null,
    status: { current: mockStatus, setEnabled: jest.fn(), openAccessibility: jest.fn(), openAppSettings: jest.fn() },
    preferences: {
      current: {
        voice: true,
        card: true,
        notification: false,
        cardLayout: 'complete',
        cardSize: 'large',
        durationSeconds: 12,
        imageReading: false,
        monitoredPackages: ['com.ubercab.driver', 'com.app99.driver', 'sinet.startup.inDriver'],
      },
      update: jest.fn(),
      setFloating: jest.fn(),
      setNotification: jest.fn(),
    },
    tests: mockTests,
    diagnostics: { enabled: false, lines: [], toggle: jest.fn() },
  }),
}));

const renderScreen = (element: React.ReactElement) => render(<SafeAreaProvider initialMetrics={METRICS}>{element}</SafeAreaProvider>);

describe('ajustes do Copiloto', () => {
  it('mostra a leitura com o estado da permissão, como avisar e o cartão', async () => {
    await renderScreen(<CopilotScreen />);

    expect(screen.getByText('Ler ofertas')).toBeTruthy();
    expect(screen.getByText('Permissão de acessibilidade ativa')).toBeTruthy();
    expect(screen.getByText('Ler pela imagem da tela')).toBeTruthy();
    expect(screen.getByText('Como avisar')).toBeTruthy();
    for (const channel of ['Voz', 'Cartão sobre o app', 'Notificação', 'Botão flutuante']) expect(screen.getByText(channel)).toBeTruthy();
    expect(screen.getByText('Completo · grande · 12 s')).toBeTruthy();
    expect(screen.getByText('Uber, 99, inDrive')).toBeTruthy();
  });

  it('testa o cartão e leva para a aparência e para a leitura', async () => {
    await renderScreen(<CopilotScreen />);

    await fireEvent.press(screen.getByText('Testar o cartão agora'));
    expect(mockTests.test).toHaveBeenCalled();
    await fireEvent.press(screen.getByText('Aparência do cartão'));
    expect(mockPush).toHaveBeenCalledWith('/copilot-card');
    await fireEvent.press(screen.getByText('Leitura não funcionou?'));
    expect(mockPush).toHaveBeenCalledWith('/copilot-reading');
  });
});

describe('configuração do Copiloto', () => {
  it('sem a permissão, mostra o passo 1 de 2 com os passos e o aviso de configuração restrita', async () => {
    mockStatus.accessibilityGranted = false;
    await renderScreen(<CopilotSetupScreen />);

    expect(screen.getByText('Passo 1 de 2')).toBeTruthy();
    expect(screen.getByText('Deixe o Copiloto ler a tela')).toBeTruthy();
    expect(screen.getByText('Toque em Abrir configurações.')).toBeTruthy();
    expect(screen.getByText(/configuração restrita/)).toBeTruthy();
    expect(screen.getByText('Abrir configurações')).toBeTruthy();
    expect(screen.getByText('Fazer depois')).toBeTruthy();
  });
});
