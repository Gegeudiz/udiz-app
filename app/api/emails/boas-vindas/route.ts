import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { resolveAppBaseUrl } from "@/lib/appUrl";
import { buildBoasVindasEmailHtml } from "@/lib/emails/boasVindasHtml";

/**
 * Envia email de boas-vindas após cadastro (sessão imediata).
 * Requer RESEND_API_KEY + WELCOME_EMAIL_FROM na Vercel; sem isso retorna ok e não envia.
 *
 * No Supabase: Authentication → Providers → Email → desative "Confirm email"
 * para o usuário entrar direto; este email é só convite/CTA opcional.
 */
export async function POST(request: NextRequest) {
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
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
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
    return NextResponse.json(
      { ok: false, error: "resend_failed", detail: text.slice(0, 500) },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
