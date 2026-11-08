import { act, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AccessibilityInfo } from 'react-native';
import { AppSplash } from '@shared/ui/AppSplash';

jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn(async () => undefined), preventAutoHideAsync: jest.fn(async () => undefined) }));

describe('abertura do app', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => jest.useRealTimers());

  it('enquanto carrega, a marca fica parada e cobre a tela', async () => {
    const onDone = jest.fn();
    await render(<AppSplash ready={false} onDone={onDone} />);

    await act(async () => jest.advanceTimersByTime(2000));

    expect(screen.getByTestId('app-splash', { includeHiddenElements: true })).toHaveProp('pointerEvents', 'auto');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('esconde a abertura nativa assim que a marca em JS aparece', async () => {
    await render(<AppSplash ready={false} onDone={jest.fn()} />);

    await act(async () => screen.getByTestId('app-splash', { includeHiddenElements: true }).props.onLayout());

    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it.each([
    ['running', '#4FD08D'],
    ['paused', '#F1B84B'],
  ] as const)('com a jornada %s, o ponto acende em %s', async (shift, color) => {
    await render(<AppSplash ready={false} shift={shift} onDone={jest.fn()} />);

    expect(screen.getByTestId('splash-light', { includeHiddenElements: true })).toHaveStyle({ backgroundColor: color });
  });

  it('sem jornada, o ponto fica branco e a marca só some', async () => {
    const onDone = jest.fn();
    await render(<AppSplash ready shift="idle" onDone={onDone} />);

    expect(screen.getByTestId('splash-light', { includeHiddenElements: true })).toHaveStyle({ backgroundColor: '#FFFFFF' });
    await act(async () => jest.advanceTimersByTime(400));
    expect(onDone).toHaveBeenCalled();
  });

  it('com o app pronto, acende o ponto, some e libera o toque', async () => {
    const onDone = jest.fn();
    await render(<AppSplash ready shift="running" onDone={onDone} />);

    expect(screen.getByTestId('app-splash', { includeHiddenElements: true })).toHaveProp('pointerEvents', 'none');
    await act(async () => jest.advanceTimersByTime(1000));

    expect(onDone).toHaveBeenCalled();
  });

  it('com animações reduzidas, só some rápido', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const onDone = jest.fn();
    await render(<AppSplash ready onDone={onDone} />);

    await act(async () => jest.advanceTimersByTime(200));

    expect(onDone).toHaveBeenCalled();
  });
});
