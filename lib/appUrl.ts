import type { NextRequest } from "next/server";

/** Remove espaços acidentais (ex.: variável de ambiente "https://udiz.com.br ") e barras finais. */
function stripTrailingSlash(u: string) {
  return u.trim().replace(/\/+$/, "");
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
    const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").trim();
    const proto = (request.headers.get("x-forwarded-proto") ?? "https").trim();
    if (host) return stripTrailingSlash(`${proto}://${host}`);
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return stripTrailingSlash(`https://${vercel}`);

  return "http://localhost:3000";
}

/**
 * Base pública a partir da request (Route Handlers na Vercel).
 *
 * 1) `AUTH_PUBLIC_APP_URL` (só servidor, ex.: https://udiz.com.br) — use na Vercel para forçar o domínio
 *    do link de recuperação de senha, mesmo se `NEXT_PUBLIC_APP_URL` estiver como localhost.
 * 2) Host da requisição (não-loopback).
 * 3) `NEXT_PUBLIC_APP_URL` se não for loopback.
 * 4) `VERCEL_URL` / localhost.
 *
 * No Supabase (Authentication → URL Configuration): se o `redirect_to` enviado não estiver em **Redirect URLs**,
 * o Auth usa a **Site URL**; se a Site URL for localhost, o email continuará com localhost — ajuste lá também.
 */
export function resolvePublicAppBaseUrlFromRequest(request: NextRequest): string {
  const authOverride = process.env.AUTH_PUBLIC_APP_URL?.trim();
  if (authOverride) {
    try {
      const o = stripTrailingSlash(authOverride);
      if (!isLoopbackOrigin(o)) return o;
    } catch {
      /* ignorar valor inválido */
    }
  }

  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").trim();
  const proto = (request.headers.get("x-forwarded-proto") ?? "https").trim();

  if (host) {
    const fromRequest = stripTrailingSlash(`${proto}://${host}`);
    if (!isLoopbackOrigin(fromRequest)) {
      return fromRequest;
    }
  }

  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    const e = stripTrailingSlash(explicit);
    if (!isLoopbackOrigin(e)) return e;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return stripTrailingSlash(`https://${vercel}`);

  if (host) return stripTrailingSlash(`${proto}://${host}`);

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
