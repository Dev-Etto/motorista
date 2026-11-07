import { useCallback, useState } from 'react';

export function useFormFields<Key extends string>(initial: Record<Key, string>) {
  const [values, setValues] = useState(initial);

  const setField = useCallback((key: Key, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  }, []);

  const bind = useCallback(
    (key: Key) => ({
      value: values[key],
      onChangeText: (text: string) => setField(key, text),
    }),
    [values, setField],
  );

  return { values, setValues, setField, bind };
}
