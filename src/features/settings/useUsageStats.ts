import { shiftRepository } from '@/data/repositories/shiftRepository';
import { useAsyncData } from '@/shared/hooks/useAsyncData';

export type UsageStats = Awaited<ReturnType<typeof shiftRepository.usageStats>>;

export const useUsageStats = () => useAsyncData(() => shiftRepository.usageStats());
