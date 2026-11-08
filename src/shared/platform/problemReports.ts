export interface ProblemReportPayload {
  description: string;
  version: string;
  android: string;
  device: string;
  language: string;
  accessibilityGranted: boolean;
  failedReads: number;
  readings: string[];
}

export interface ProblemReportTransport {
  send(payload: ProblemReportPayload): Promise<void>;
}

let transport: ProblemReportTransport = {
  send: async () => {
    throw new Error('problem report transport not set');
  },
};

export function setProblemReportTransport(next: ProblemReportTransport): void {
  transport = next;
}

export function sendProblemReport(payload: ProblemReportPayload): Promise<void> {
  return transport.send(payload);
}
