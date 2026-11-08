import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PlatformsScreen from '@features/settings/PlatformsScreen';
import { confirmAction } from '@shared/ui/dialog';

const mockToggle = jest.fn();

jest.mock('@shared/ui/dialog', () => ({ confirmAction: jest.fn() }));
jest.mock('@features/settings/usePlatforms', () => ({
  usePlatforms: () => ({
    state: {
      data: [
        { id: 1, name: 'Uber', key: 'uber', active: true },
        { id: 4, name: 'Particular', key: 'private', active: true },
      ],
      loading: false,
      error: null,
      reload: jest.fn(),
    },
    toggle: mockToggle,
  }),
}));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

describe('desligar plataforma', () => {
  beforeEach(() => jest.clearAllMocks());

  it('plataforma lida pelo Copiloto pede confirmação', async () => {
    await render(
      <SafeAreaProvider initialMetrics={METRICS}>
        <PlatformsScreen />
      </SafeAreaProvider>,
    );

    await fireEvent(screen.getByLabelText('Uber'), 'valueChange', false);

    expect(mockToggle).not.toHaveBeenCalled();
    expect(jest.mocked(confirmAction).mock.calls[0]?.[0].title).toBe('Desligar Uber?');
  });

  it('plataforma sem Copiloto desliga direto', async () => {
    await render(
      <SafeAreaProvider initialMetrics={METRICS}>
        <PlatformsScreen />
      </SafeAreaProvider>,
    );

    await fireEvent(screen.getByLabelText('Particular'), 'valueChange', false);

    expect(mockToggle).toHaveBeenCalledWith(4, false);
  });
});
