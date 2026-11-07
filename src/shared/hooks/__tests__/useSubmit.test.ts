import { act, renderHook } from '@testing-library/react-native';
import { useSubmit } from '@shared/hooks/useSubmit';

describe('useSubmit', () => {
  it('dois toques seguidos gravam uma vez só', async () => {
    let finish = () => {};
    const action = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { result } = await renderHook(() => useSubmit(action));

    await act(async () => {
      void result.current.submit();
      void result.current.submit();
      finish();
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('repassa os argumentos para a ação', async () => {
    const action = jest.fn(async (_hour: string) => {});
    const { result } = await renderHook(() => useSubmit(action));

    await act(async () => result.current.submit('20'));

    expect(action).toHaveBeenCalledWith('20');
  });

  it('mostra erro quando a gravação falha', async () => {
    const { result } = await renderHook(() => useSubmit(async () => Promise.reject(new Error('falhou'))));

    await act(async () => result.current.submit());

    expect(result.current.error).toBe('Não foi possível salvar. Tente de novo.');
  });
});
