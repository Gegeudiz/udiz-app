type EventPayload = Record<string, string | number | boolean | null | undefined>;

const STORAGE_KEY = "udiz_events";

type TelemetryEvent = {
  event: string;
  at: string;
  payload?: EventPayload;
};

export function trackEvent(event: string, payload?: EventPayload) {
  if (typeof window === "undefined") return;
  const item: TelemetryEvent = { event, at: new Date().toISOString(), payload };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as TelemetryEvent[]) : [];
    list.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-300)));
  } catch {
    // Avoid blocking UX if telemetry storage fails.
  }
  if (process.env.NODE_ENV !== "production") {
    console.info("[udiz:event]", item);
  }
}

export function readEvents(): TelemetryEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TelemetryEvent[]) : [];
  } catch {
    return [];
  }
}

