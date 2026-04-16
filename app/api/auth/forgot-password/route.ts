import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { resolvePublicAppBaseUrlFromRequest } from "@/lib/appUrl";

/**
 * Envia email de recuperação de senha com `redirectTo` baseado no host da requisição (Vercel),
 * para o link do email não apontar para localhost quando o .env de produção estiver errado.
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
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
