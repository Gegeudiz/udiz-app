/** Só existe na aba em que o admin fez login com "Entrar como Administrador". */
export const ADMIN_GATE_KEY = "udiz_admin_gate_v1";

export function setAdminGate(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ADMIN_GATE_KEY, "1");
}

export function hasAdminGate(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_GATE_KEY) === "1";
}

export function clearAdminGate(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADMIN_GATE_KEY);
}
