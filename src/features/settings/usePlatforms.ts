import { platformRepository } from '@data/repositories/platformRepository';
import { useAsyncData } from '@shared/hooks/useAsyncData';

export function usePlatforms() {
  const state = useAsyncData(() => platformRepository.list());

  const add = async (name: string) => {
    await platformRepository.add(name);
    await state.reload();
  };

  const deactivate = async (id: number) => {
    await platformRepository.deactivate(id);
    await state.reload();
  };

  return { state, add, deactivate };
}
