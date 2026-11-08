import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';
import { useAsyncData } from '@shared/hooks/useAsyncData';

const mockFocus = { focused: true };

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    const { useEffect: useMountEffect } = jest.requireActual('react');
    const focused = mockFocus.focused;
    useMountEffect(() => (focused ? callback() : undefined), [callback, focused]);
  },
}));
jest.mock('@shared/utils/reportError', () => ({ reportError: jest.fn() }));

describe('useAsyncData', () => {
  beforeEach(() => {
    mockFocus.focused = true;
  });

  it('ao voltar para o app, recarrega só a tela em foco', async () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
      listeners.push(listener);
      return { remove };
    });
    const loader = jest.fn().mockResolvedValue('ok');
    const { rerender } = await renderHook(() => useAsyncData(loader));
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    await act(async () => listeners.forEach((listener) => listener('active')));
    expect(loader).toHaveBeenCalledTimes(2);

    mockFocus.focused = false;
    await rerender({});
    expect(remove).toHaveBeenCalled();
  });

  it('carrega uma vez ao montar', async () => {
    const loader = jest.fn().mockResolvedValue('ok');
    const { result } = await renderHook(() => useAsyncData(loader));

    await waitFor(() => expect(result.current.data).toBe('ok'));
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('volta a carregar e esconde o dado antigo quando o período muda', async () => {
    let finish = (_value: string) => {};
    const loader = jest.fn((period: string) => (period === 'nov' ? Promise.resolve('dados de nov') : new Promise<string>((resolve) => (finish = resolve))));
    const { result, rerender } = await renderHook(({ period }: { period: string }) => useAsyncData(() => loader(period), [period]), {
      initialProps: { period: 'nov' },
    });
    await waitFor(() => expect(result.current.data).toBe('dados de nov'));

    await rerender({ period: 'dez' });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    await act(async () => finish('dados de dez'));
    expect(result.current.data).toBe('dados de dez');
    expect(result.current.loading).toBe(false);
  });

  it('mostra erro quando o carregamento falha', async () => {
    const { result } = await renderHook(() => useAsyncData(() => Promise.reject(new Error('banco'))));

    await waitFor(() => expect(result.current.error).toBe('Não foi possível carregar os dados.'));
    expect(result.current.loading).toBe(false);
  });
});
