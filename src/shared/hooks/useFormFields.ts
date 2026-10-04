import { useCallback, useState } from 'react';

export function useFormFields<T extends Record<string, string>>(initial: T) {
  const [values, setValues] = useState<T>(initial);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  }, []);

  const bind = useCallback(
    <K extends keyof T>(key: K) => ({
      value: values[key],
      onChangeText: (text: string) => setField(key, text as T[K]),
    }),
    [values, setField],
  );

  return { values, setValues, setField, bind };
}
