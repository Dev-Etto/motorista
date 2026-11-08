import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { closeToast, showToast } from '@shared/ui/toast';
import { TOAST_DURATION_MS, ToastHost } from '@shared/ui/ToastHost';

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const renderHost = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ToastHost />
    </SafeAreaProvider>,
  );

describe('aviso rápido', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(async () => {
    await act(async () => closeToast());
    jest.useRealTimers();
  });

  it('mostra a mensagem e some sozinho', async () => {
    await renderHost();
    await act(async () => showToast({ message: 'Jornada salva' }));
    expect(screen.getByText('Jornada salva')).toBeTruthy();

    await act(async () => jest.advanceTimersByTime(TOAST_DURATION_MS));
    expect(screen.queryByText('Jornada salva')).toBeNull();
  });

  it('desfazer roda a ação e fecha o aviso', async () => {
    const onAction = jest.fn();
    await renderHost();
    await act(async () => showToast({ message: 'Jornada excluída', actionLabel: 'Desfazer', onAction }));

    await fireEvent.press(screen.getByRole('button', { name: 'Desfazer' }));

    expect(onAction).toHaveBeenCalled();
    expect(screen.queryByText('Jornada excluída')).toBeNull();
  });
});
