import type { NextRequest } from "next/server";

function stripTrailingSlash(u: string) {
  return u.replace(/\/+$/, "");
}

/**
 * URL pública do app (links em emails, etc.).
 * Em produção na Vercel, NEXT_PUBLIC_APP_URL ou cabeçalhos do request costumam bastar.
 */
export function resolveAppBaseUrl(request?: NextRequest): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  if (request) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    if (host) return stripTrailingSlash(`${proto}://${host}`);
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return stripTrailingSlash(`https://${vercel}`);

  return "http://localhost:3000";
}

/** URL absoluta da página pública de um produto (compartilhar, WhatsApp). */
export function buildProdutoPageAbsoluteUrl(baseUrl: string, produtoId: string): string {
  const b = baseUrl.replace(/\/+$/, "");
  return `${b}/produto/${encodeURIComponent(produtoId)}`;
}

/**
 * Destino do link "Esqueci a senha" (deve ser a URL **pública** do site, nunca só localhost em produção).
 * 1) NEXT_PUBLIC_APP_URL no .env (ex.: https://udiz-app-one.vercel.app) — obrigatório na Vercel
 * 2) senão, origem atual do navegador (ok para dev local)
 */
export function getAuthCallbackRedirectUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const base = explicit
    ? stripTrailingSlash(explicit)
    : typeof window !== "undefined"
      ? stripTrailingSlash(window.location.origin)
      : "";
  if (!base) return "";
  return `${base}/auth/callback`;
}
