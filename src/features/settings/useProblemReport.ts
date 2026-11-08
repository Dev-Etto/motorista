import { useCallback, useState } from 'react';
import { type ProblemReportPayload, sendProblemReport } from '@shared/platform/problemReports';
import { reportError } from '@shared/utils/reportError';

export type ProblemReportStatus = 'idle' | 'sending' | 'sent' | 'failed';

export function useProblemReport() {
  const [status, setStatus] = useState<ProblemReportStatus>('idle');

  const send = useCallback(async (payload: ProblemReportPayload) => {
    setStatus('sending');
    try {
      await sendProblemReport(payload);
      setStatus('sent');
    } catch (error) {
      reportError(error);
      setStatus('failed');
    }
  }, []);

  return { status, send };
}
