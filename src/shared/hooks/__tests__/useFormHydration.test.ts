import { renderHook } from '@testing-library/react-native';
import { useFormHydration } from '@shared/hooks/useFormHydration';

describe('useFormHydration', () => {
  it('preenche o formulário só na primeira vez que o dado chega', async () => {
    const apply = jest.fn();
    const { rerender } = await renderHook(({ data }: { data: { cents: number } | null }) => useFormHydration(data, apply, 'mes'), {
      initialProps: { data: null as { cents: number } | null },
    });

    await rerender({ data: { cents: 100 } });
    await rerender({ data: { cents: 100 } });
    await rerender({ data: { cents: 200 } });

    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith({ cents: 100 });
  });

  it('preenche de novo quando a chave muda', async () => {
    const apply = jest.fn();
    const { rerender } = await renderHook(({ data, key }: { data: { cents: number }; key: string }) => useFormHydration(data, apply, key), {
      initialProps: { data: { cents: 100 }, key: '2026-11' },
    });

    await rerender({ data: { cents: 300 }, key: '2026-12' });

    expect(apply).toHaveBeenLastCalledWith({ cents: 300 });
    expect(apply).toHaveBeenCalledTimes(2);
  });
});
