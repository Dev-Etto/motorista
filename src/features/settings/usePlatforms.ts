import { setPlatformActive } from '@application/platforms';
import { platformRepository } from '@data/repositories/platformRepository';
import { useAsyncData } from '@shared/hooks/useAsyncData';

export function usePlatforms() {
  const state = useAsyncData(() => platformRepository.listAll());

  const toggle = async (id: number, active: boolean) => {
    await setPlatformActive(id, active);
    await state.reload();
  };

  return { state, toggle };
}
