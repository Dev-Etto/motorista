import { useCallback, useEffect, useState } from 'react';
import { acceptAccessibilityDisclosure, hasAccessibilityConsent } from '@application/accessibilityConsent';
import { reportError } from '@shared/utils/reportError';

export function useAccessibilityConsent() {
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    hasAccessibilityConsent().then(setAccepted, reportError);
  }, []);

  const accept = useCallback(async () => {
    await acceptAccessibilityDisclosure();
    setAccepted(true);
  }, []);

  return { accepted, accept };
}
