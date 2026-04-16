import type { NextRequest } from "next/server";

function stripTrailingSlash(u: string) {
  return u.replace(/\/+$/, "");
}

function isLoopbackOrigin(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

/**
 * No navegador: origem pública do app.
 * Se `NEXT_PUBLIC_APP_URL` estiver como `http://localhost:3000` por engano no deploy, mas o usuário
 * acessa `https://udiz.com.br`, usamos sempre a origem real — senão links de recuperação de senha
 * vão para localhost no celular.
 */
export function resolveBrowserPublicOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const explicit = raw ? stripTrailingSlash(raw) : "";

  if (typeof window === "undefined") {
    return explicit;
  }

  const origin = stripTrailingSlash(window.location.origin);

  if (!isLoopbackOrigin(origin)) {
    return origin;
  }

  if (explicit && !isLoopbackOrigin(explicit)) {
    return explicit;
  }

  return origin;
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
 * No cliente: `resolveBrowserPublicOrigin()` (evita localhost no email quando o deploy tem .env errado).
 * No Supabase: Authentication → URL Configuration → Redirect URLs deve incluir `{origem}/auth/callback`.
 */
export function getAuthCallbackRedirectUrl(): string {
  let base = "";

  if (typeof window !== "undefined") {
    base = resolveBrowserPublicOrigin();
  } else {
    const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
    base = explicit ? stripTrailingSlash(explicit) : "";
    const vercel = process.env.VERCEL_URL?.trim();
    if (!base && vercel) base = stripTrailingSlash(`https://${vercel}`);
  }

  if (!base) return "";
  return `${base}/auth/callback`;
}
