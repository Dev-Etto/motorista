import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PrivacyScreen from '@features/settings/PrivacyScreen';
import { copilot } from '@modules/copilot';
import { confirmAction } from '@shared/ui/dialog';

const mockPush = jest.fn();
const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@shared/ui/dialog', () => ({ confirmAction: jest.fn() }));
jest.mock('@modules/copilot', () => ({ copilot: { clearAllData: jest.fn() } }));

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PrivacyScreen />
    </SafeAreaProvider>,
  );

describe('privacidade', () => {
  beforeEach(() => jest.clearAllMocks());

  it('leva para as escolhas de privacidade', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByText('Escolhas de privacidade'));
    expect(mockPush).toHaveBeenCalledWith('/privacy-choices');
  });

  it('apagar todos os dados pede confirmação e só apaga ao confirmar', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByText('Apagar todos os meus dados'));
    const options = jest.mocked(confirmAction).mock.calls[0]?.[0];
    expect(options?.title).toBe('Apagar todos os dados?');
    expect(copilot.clearAllData).not.toHaveBeenCalled();

    await options?.onConfirm();
    expect(copilot.clearAllData).toHaveBeenCalled();
  });
});
