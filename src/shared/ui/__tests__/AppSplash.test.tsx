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

  it('com o app pronto, acende o ponto, some e libera o toque', async () => {
    const onDone = jest.fn();
    await render(<AppSplash ready onDone={onDone} />);

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
