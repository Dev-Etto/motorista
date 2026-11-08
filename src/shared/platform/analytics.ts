export type AnalyticsParams = Record<string, string | number | boolean>;

export interface AnalyticsTransport {
  send(event: string, params: AnalyticsParams): Promise<void>;
}

const noTransport: AnalyticsTransport = { send: async () => undefined };

let transport: AnalyticsTransport = noTransport;

export function setAnalyticsTransport(next: AnalyticsTransport): void {
  transport = next;
}

export function sendAnalyticsEvent(event: string, params: AnalyticsParams): Promise<void> {
  return transport.send(event, params);
}
