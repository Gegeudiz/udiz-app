export function newUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const rand = Math.random().toString(16).slice(2);
  return `udiz-${Date.now()}-${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

