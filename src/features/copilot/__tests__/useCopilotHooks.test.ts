import { act, renderHook } from '@testing-library/react-native';
import { useCopilotDiagnostics } from '@features/copilot/useCopilotDiagnostics';
import { useCopilotPreferences } from '@features/copilot/useCopilotPreferences';
import { useCopilotTests } from '@features/copilot/useCopilotTests';
import { copilot } from '@modules/copilot';
import { ensureNotifications } from '@shared/platform/notifications';

const PREFERENCES = {
  voice: true,
  card: true,
  notification: false,
  primaryMetric: 'perKm',
  cardLayout: 'complete',
  cardSize: 'large',
  theme: 'system',
  durationSeconds: 8,
  monitoredPackages: ['com.ubercab.driver'],
  estimateEarnings: true,
  imageReading: false,
  floatingButton: true,
};

jest.mock('@shared/platform/notifications', () => ({ ensureNotifications: jest.fn() }));
jest.mock('@modules/copilot', () => ({
  copilot: {
    getPreferences: jest.fn(() => PREFERENCES),
    setPreferences: jest.fn(),
    setDiagnosticsEnabled: jest.fn(),
    getDiagnostics: jest.fn(() => []),
    testOffer: jest.fn(),
    resetCardPosition: jest.fn(),
  },
}));
jest.mock('@modules/copilot/platforms', () => ({
  ...jest.requireActual('@modules/copilot/platforms'),
  PLATFORM_PACKAGES: { uber: 'uber', ninetyNine: '99', inDrive: 'indrive' },
}));

describe('preferências do Copiloto', () => {
  it('não liga a notificação sem permissão e avisa', async () => {
    jest.mocked(ensureNotifications).mockResolvedValue(false);
    const notify = jest.fn();
    const { result } = await renderHook(() => useCopilotPreferences(jest.fn(), notify));

    await act(async () => result.current.setNotification(true));

    expect(notify).toHaveBeenCalledWith('Permita as notificações do app para usar este canal.');
    expect(result.current.current.notification).toBe(false);
  });
});

describe('testes do Copiloto', () => {
  it('avisa que falta acessibilidade quando o teste não aparece', async () => {
    jest.mocked(copilot.testOffer).mockReturnValue(false);
    const notify = jest.fn();
    const refresh = jest.fn();
    const { result } = await renderHook(() => useCopilotTests(refresh, notify));

    await act(async () => result.current.test());

    expect(notify).toHaveBeenCalledWith('Ative o serviço de acessibilidade para testar.');
    expect(refresh).toHaveBeenCalled();
  });
});

describe('calibração do Copiloto', () => {
  it('desligar limpa as leituras', async () => {
    const { result } = await renderHook(() => useCopilotDiagnostics());

    await act(async () => result.current.toggle(true));
    await act(async () => result.current.toggle(false));

    expect(copilot.setDiagnosticsEnabled).toHaveBeenLastCalledWith(false);
    expect(result.current.lines).toEqual([]);
    expect(result.current.enabled).toBe(false);
  });
});
