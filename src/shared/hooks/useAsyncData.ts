import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { i18n } from '@shared/i18n';
import { reportError } from '@shared/utils/reportError';
import { useLatest } from './useLatest';

export interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

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
    } catch (caught) {
      reportError(caught);
      if (current !== requestId.current) return;
      setError(i18n.t('errors.load'));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [latestLoader]);

  const loadedKey = useRef(depsKey);

  useEffect(() => {
    if (loadedKey.current === depsKey) return;

    loadedKey.current = depsKey;
    setData(null);
    setLoading(true);
    void reload();
  }, [reload, depsKey]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reload();
    });
    return () => subscription.remove();
  }, [reload]);

  return { data, loading, error, reload };
}
