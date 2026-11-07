import { quoteRepository } from '@data/repositories/quoteRepository';
import { useAsyncData } from '@shared/hooks/useAsyncData';

export function useSavedQuotes() {
  const state = useAsyncData(() => quoteRepository.list());

  const save = async (label: string | null, priceCents: number, data: unknown) => {
    await quoteRepository.save(label, priceCents, data);
    await state.reload();
  };

  const remove = async (id: number) => {
    await quoteRepository.remove(id);
    await state.reload();
  };

  return { state, save, remove };
}
