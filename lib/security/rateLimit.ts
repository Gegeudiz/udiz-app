type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function nowMs(): number {
  return Date.now();
}

function buildKey(scope: string, actor: string): string {
  return `${scope}:${actor}`;
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function checkRateLimit(input: {
  scope: string;
  actor: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; retryAfterSeconds: number } {
  const key = buildKey(input.scope, input.actor);
  const now = nowMs();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + input.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= input.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000)
    );
    return { allowed: false, retryAfterSeconds };
  }

  current.count += 1;
  buckets.set(key, current);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function securityLog(
  event: string,
  details: Record<string, unknown>
): void {
  console.warn(
    JSON.stringify({
      level: "warn",
      category: "security",
      event,
      timestamp: new Date().toISOString(),
      ...details,
    })
  );
}
