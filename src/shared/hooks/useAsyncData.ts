import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLatest } from './useLatest';

export interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const LOAD_ERROR = 'Não foi possível carregar os dados.';

export function useAsyncData<T>(loader: () => Promise<T>, deps: readonly unknown[] = []): AsyncData<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const latestLoader = useLatest(loader);
  const depsKey = JSON.stringify(deps);

  const reload = useCallback(async () => {
    const current = ++requestId.current;
    try {
      const result = await latestLoader.current();
      if (current !== requestId.current) return;
      setData(result);
      setError(null);
    } catch {
      if (current !== requestId.current) return;
      setError(LOAD_ERROR);
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [latestLoader]);

  useEffect(() => {
    void reload();
  }, [reload, depsKey]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { data, loading, error, reload };
}
