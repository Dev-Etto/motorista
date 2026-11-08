export type AnalyticsParams = Record<string, string | number | boolean>;

export interface AnalyticsTransport {
  send(event: string, params: AnalyticsParams): Promise<void>;
}

let transport: AnalyticsTransport = { send: async () => undefined };

export function setAnalyticsTransport(next: AnalyticsTransport): void {
  transport = next;
}

export function sendAnalyticsEvent(event: string, params: AnalyticsParams): Promise<void> {
  return transport.send(event, params);
}
