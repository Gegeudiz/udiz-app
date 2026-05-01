import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { resolvePublicAppBaseUrlFromRequest } from "@/lib/appUrl";
import { checkRateLimit, getClientIp, securityLog } from "@/lib/security/rateLimit";

/**
 * Envia email de recuperação de senha com `redirectTo` calculado no servidor (`resolvePublicAppBaseUrlFromRequest`).
 *
 * Obrigatório no painel Supabase → Authentication → URL Configuration:
 * - Site URL: https://udiz.com.br (seu domínio público, não localhost)
 * - Redirect URLs: inclua https://udiz.com.br/auth/callback (e/ou https://udiz.com.br/**)
 * Se o redirect não estiver permitido, o Supabase ignora e usa a Site URL (muitas vezes localhost).
 *
 * Na Vercel, defina AUTH_PUBLIC_APP_URL=https://udiz.com.br para garantir o domínio do link.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const ipLimit = checkRateLimit({
    scope: "forgot_password_ip",
    actor: ip,
    limit: 10,
    windowMs: 60_000,
  });
  if (!ipLimit.allowed) {
    securityLog("rate_limit_blocked", {
      route: "/api/auth/forgot-password",
      actorType: "ip",
      actor: ip,
    });
    return NextResponse.json(
      { ok: false, error: "too_many_requests" },
      {
        status: 429,
        headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
      }
    );
  }

  const emailActor = email.toLowerCase();
  const emailLimit = checkRateLimit({
    scope: "forgot_password_email",
    actor: emailActor,
    limit: 3,
    windowMs: 10 * 60_000,
  });
  if (!emailLimit.allowed) {
    securityLog("rate_limit_blocked", {
      route: "/api/auth/forgot-password",
      actorType: "email",
      actor: emailActor,
    });
    return NextResponse.json(
      { ok: false, error: "too_many_requests" },
      {
        status: 429,
        headers: { "Retry-After": String(emailLimit.retryAfterSeconds) },
      }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
  }

  const base = resolvePublicAppBaseUrlFromRequest(request);
  const redirectTo = `${base}/auth/callback`;

  const supabase = createClient(url, anon);
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    securityLog("forgot_password_upstream_error", {
      route: "/api/auth/forgot-password",
      code: error.code ?? "unknown",
      status: error.status ?? "unknown",
      ip,
    });
    // Resposta neutra para não facilitar enumeração de usuário.
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
