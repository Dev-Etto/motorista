import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAsyncData } from '../useAsyncData';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect: useMountEffect } = jest.requireActual('react');
    useMountEffect(callback, [callback]);
  },
}));
jest.mock('@/shared/utils/reportError', () => ({ reportError: jest.fn() }));

describe('useAsyncData', () => {
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
