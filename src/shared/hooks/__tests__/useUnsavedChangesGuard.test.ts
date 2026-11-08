import { act, renderHook } from '@testing-library/react-native';
import { usePreventRemove } from 'expo-router';
import { useUnsavedChangesGuard } from '@shared/hooks/useUnsavedChangesGuard';
import { showDialog } from '@shared/ui/dialog';

const mockAllow = jest.fn();

jest.mock('expo-router', () => ({ usePreventRemove: jest.fn(() => mockAllow) }));
jest.mock('@shared/ui/dialog', () => ({ showDialog: jest.fn() }));

describe('alterações não salvas', () => {
  it('só bloqueia a saída com alterações', async () => {
    await renderHook(() => useUnsavedChangesGuard(false));
    expect(jest.mocked(usePreventRemove).mock.calls.at(-1)?.[0]).toBe(false);

    await renderHook(() => useUnsavedChangesGuard(true));
    expect(jest.mocked(usePreventRemove).mock.calls.at(-1)?.[0]).toBe(true);
  });

  it('descartar deixa sair e repete a saída', async () => {
    await renderHook(() => useUnsavedChangesGuard(true));
    const repeat = jest.fn();
    jest
      .mocked(usePreventRemove)
      .mock.calls.at(-1)?.[1]?.({ data: { action: {} as never }, repeat });

    const options = jest.mocked(showDialog).mock.calls.at(-1)?.[0];
    expect(options?.title).toBe('Descartar as alterações?');
    await act(async () => options?.actions[1]?.onPress?.());

    expect(jest.mocked(usePreventRemove).mock.calls.at(-1)?.[0]).toBe(false);
    expect(repeat).toHaveBeenCalled();
  });

  it('salvar libera a saída', async () => {
    const { result } = await renderHook(() => useUnsavedChangesGuard(true));
    result.current();
    expect(mockAllow).toHaveBeenCalled();
  });
});
