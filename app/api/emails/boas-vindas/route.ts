import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { resolveAppBaseUrl } from "@/lib/appUrl";
import { buildBoasVindasEmailHtml } from "@/lib/emails/boasVindasHtml";
import { checkRateLimit, getClientIp, securityLog } from "@/lib/security/rateLimit";

/**
 * Envia email de boas-vindas após cadastro (sessão imediata).
 * Requer RESEND_API_KEY + WELCOME_EMAIL_FROM na Vercel; sem isso retorna ok e não envia.
 *
 * No Supabase: Authentication → Providers → Email → desative "Confirm email"
 * para o usuário entrar direto; este email é só convite/CTA opcional.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = checkRateLimit({
    scope: "boas_vindas_email_ip",
    actor: ip,
    limit: 30,
    windowMs: 60_000,
  });
  if (!ipLimit.allowed) {
    securityLog("rate_limit_blocked", {
      route: "/api/emails/boas-vindas",
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

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
  }

  const supabase = createClient(url, anon);
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser(token);
  if (userErr || !user?.email) {
    securityLog("invalid_session_token", {
      route: "/api/emails/boas-vindas",
      ip,
    });
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
  }

  const userLimit = checkRateLimit({
    scope: "boas_vindas_email_user",
    actor: user.id,
    limit: 3,
    windowMs: 10 * 60_000,
  });
  if (!userLimit.allowed) {
    securityLog("rate_limit_blocked", {
      route: "/api/emails/boas-vindas",
      actorType: "user_id",
      actor: user.id,
      ip,
    });
    return NextResponse.json(
      { ok: false, error: "too_many_requests" },
      {
        status: 429,
        headers: { "Retry-After": String(userLimit.retryAfterSeconds) },
      }
    );
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return NextResponse.json({ ok: true, skipped: true, reason: "no_resend" });
  }

  const from =
    process.env.WELCOME_EMAIL_FROM?.trim() || "Udiz <onboarding@resend.dev>";

  const nomeMeta =
    typeof user.user_metadata?.nome === "string" ? user.user_metadata.nome.trim() : "";
  const nome = nomeMeta.length >= 2 ? nomeMeta : user.email.split("@")[0] || "Olá";

  const base = resolveAppBaseUrl(request);
  const linkValidar = `${base}/perfil?bemvindo=1`;

  const html = buildBoasVindasEmailHtml(nome, linkValidar);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [user.email],
      subject: "Bem-vindo ao Udiz — produtos perto de você",
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    securityLog("welcome_email_provider_error", {
      route: "/api/emails/boas-vindas",
      userId: user.id,
      status: res.status,
      ip,
    });
    return NextResponse.json(
      { ok: false, error: "resend_failed", detail: text.slice(0, 500) },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
