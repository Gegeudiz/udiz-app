import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { montarTextoAdminNovaSolicitacao } from "@/lib/solicitacaoEstoqueAdminText";
import type { EstoqueSolicitacaoRow } from "@/lib/supabase/estoqueSolicitacao";
import { checkRateLimit, getClientIp, securityLog } from "@/lib/security/rateLimit";

/**
 * Notifica a equipe (seu WhatsApp via CallMeBot e/ou e-mail) quando alguém envia solicitação.
 * Não abre o WhatsApp no aparelho do lojista.
 *
 * CallMeBot (grátis): https://www.callmebot.com/blog/free-api-whatsapp-messages/
 * 1) Abra o link do site no celular, associe seu WhatsApp, copie o apikey.
 * 2) Vercel: CALLMEBOT_API_KEY=... e CALLMEBOT_PHONE=5534998335489 (só dígitos).
 *
 * Alternativa: RESEND_API_KEY + ADMIN_NOTIFY_EMAIL + NOTIFY_EMAIL_FROM (ou WELCOME_EMAIL_FROM).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = checkRateLimit({
    scope: "notify_solicitacao_ip",
    actor: ip,
    limit: 20,
    windowMs: 60_000,
  });
  if (!ipLimit.allowed) {
    securityLog("rate_limit_blocked", {
      route: "/api/notify/solicitacao-estoque",
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

  let body: { solicitacaoId?: string };
  try {
    body = (await request.json()) as { solicitacaoId?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const solicitacaoId = typeof body.solicitacaoId === "string" ? body.solicitacaoId.trim() : "";
  if (!solicitacaoId) {
    return NextResponse.json({ ok: false, error: "missing_solicitacao_id" }, { status: 400 });
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
  if (userErr || !user?.id) {
    securityLog("invalid_session_token", {
      route: "/api/notify/solicitacao-estoque",
      ip,
    });
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
  }

  const userLimit = checkRateLimit({
    scope: "notify_solicitacao_user",
    actor: user.id,
    limit: 8,
    windowMs: 60_000,
  });
  if (!userLimit.allowed) {
    securityLog("rate_limit_blocked", {
      route: "/api/notify/solicitacao-estoque",
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

  const { data: row, error: rowErr } = await supabase
    .from("estoque_solicitacoes")
    .select("*")
    .eq("id", solicitacaoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (rowErr || !row) {
    securityLog("notify_forbidden_or_not_found", {
      route: "/api/notify/solicitacao-estoque",
      userId: user.id,
      solicitacaoId,
      ip,
    });
    return NextResponse.json({ ok: false, error: "not_found_or_forbidden" }, { status: 403 });
  }

  const texto = montarTextoAdminNovaSolicitacao(row as EstoqueSolicitacaoRow);
  const channels: string[] = [];

  const callmeKey = process.env.CALLMEBOT_API_KEY?.trim();
  const callmePhone =
    process.env.CALLMEBOT_PHONE?.replace(/\D/g, "") || "5534998335489";

  if (callmeKey) {
    try {
      const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(callmePhone)}&apikey=${encodeURIComponent(callmeKey)}&text=${encodeURIComponent(texto.slice(0, 3500))}`;
      const waRes = await fetch(waUrl, { method: "GET", next: { revalidate: 0 } });
      const waText = await waRes.text();
      if (waRes.ok && !waText.toLowerCase().includes("error")) {
        channels.push("whatsapp_callmebot");
      }
    } catch {
      // não bloqueia
    }
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL?.trim();
  const from =
    process.env.NOTIFY_EMAIL_FROM?.trim() ||
    process.env.WELCOME_EMAIL_FROM?.trim() ||
    "Udiz <onboarding@resend.dev>";

  if (resendKey && adminEmail) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [adminEmail],
          subject: `[Udiz Estoque] Nova solicitação — ${(row as EstoqueSolicitacaoRow).nome_completo_dono}`,
          text: texto,
        }),
      });
      if (r.ok) channels.push("email_resend");
    } catch {
      // não bloqueia
    }
  }

  return NextResponse.json({
    ok: true,
    notified: channels.length > 0,
    channels,
  });
}
