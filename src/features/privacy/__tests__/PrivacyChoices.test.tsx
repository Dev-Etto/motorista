import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PrivacyChoicesCard } from '@features/privacy';
import PrivacyChoicesScreen from '@features/privacy/PrivacyChoicesScreen';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSave = jest.fn();
const mockState = { choices: { usageStats: false, crashReports: true, decidedAt: null as string | null } };
const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: mockBack }) }));
jest.mock('@features/privacy/usePrivacyChoices', () => ({ usePrivacyChoices: () => ({ choices: mockState.choices, save: mockSave }) }));

const renderWithSafeArea = (element: React.ReactElement) => render(<SafeAreaProvider initialMetrics={METRICS}>{element}</SafeAreaProvider>);

describe('escolhas de privacidade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.choices = { usageStats: false, crashReports: true, decidedAt: null };
  });

  it('o cartão aparece enquanto não houver escolha e leva para a tela', async () => {
    await render(<PrivacyChoicesCard />);

    expect(screen.getByText('Suas escolhas de privacidade')).toBeTruthy();
    await fireEvent.press(screen.getByText('Escolher'));
    expect(mockPush).toHaveBeenCalledWith('/privacy-choices');
  });

  it('agora não guarda a escolha com as estatísticas desligadas', async () => {
    await render(<PrivacyChoicesCard />);

    await fireEvent.press(screen.getByText('Agora não'));
    expect(mockSave).toHaveBeenCalledWith({ usageStats: false, crashReports: true });
  });

  it('depois de decidir, o cartão some', async () => {
    mockState.choices = { usageStats: true, crashReports: true, decidedAt: '2026-11-08T19:00:00.000Z' };
    await render(<PrivacyChoicesCard />);

    expect(screen.queryByText('Suas escolhas de privacidade')).toBeNull();
  });

  it('a tela mostra as opções, o que nunca é enviado e salva', async () => {
    await renderWithSafeArea(<PrivacyChoicesScreen />);

    expect(screen.getByText('Ajudar a melhorar o app')).toBeTruthy();
    expect(screen.getByText('Enviar relatórios de falha')).toBeTruthy();
    expect(screen.getByText('O que nunca é enviado')).toBeTruthy();
    await fireEvent.press(screen.getByText('Salvar escolhas'));
    expect(mockSave).toHaveBeenCalledWith({ usageStats: false, crashReports: true });
    expect(mockBack).toHaveBeenCalled();
  });
});
