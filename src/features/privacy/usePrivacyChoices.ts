import { useCallback, useEffect, useState } from 'react';
import { loadPrivacyChoices, type PrivacyChoices, savePrivacyChoices } from '@application/privacyChoices';
import { reportError } from '@shared/utils/reportError';

export function usePrivacyChoices() {
  const [choices, setChoices] = useState<PrivacyChoices | null>(null);

  useEffect(() => {
    loadPrivacyChoices().then(setChoices, reportError);
  }, []);

  const save = useCallback(async (next: Pick<PrivacyChoices, 'usageStats' | 'crashReports'>) => {
    setChoices(await savePrivacyChoices(next));
  }, []);

  return { choices, save };
}
