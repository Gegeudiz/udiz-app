import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

async function contar(
  client: ReturnType<typeof createClient>,
  tabela: "lojas" | "produtos" | "usuarios",
): Promise<number> {
  const { count, error } = await client.from(tabela).select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !anon) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const supabaseAuth = createClient(url, anon);
  const {
    data: { user },
    error: userErr,
  } = await supabaseAuth.auth.getUser(token);
  if (userErr || !user) {
    return NextResponse.json({ error: "invalid_session" }, { status: 401 });
  }

  const supabaseUser = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: perfil } = await supabaseUser
    .from("usuarios")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const metaRole =
    (typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null) ??
    (typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null);

  const papel = (perfil?.role as string | undefined) ?? metaRole ?? undefined;
  if (!isAdminRole(papel)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: rpcData, error: rpcError } = await supabaseUser.rpc("admin_dashboard_stats");
  if (!rpcError && rpcData && typeof rpcData === "object") {
    const row = rpcData as { lojas?: number; produtos?: number; usuarios?: number };
    return NextResponse.json({
      lojas: Number(row.lojas ?? 0),
      produtos: Number(row.produtos ?? 0),
      usuarios: Number(row.usuarios ?? 0),
    });
  }

  if (!serviceKey) {
    return NextResponse.json({ error: "stats_unavailable" }, { status: 503 });
  }

  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const [lojas, produtos, usuarios] = await Promise.all([
      contar(supabaseAdmin, "lojas"),
      contar(supabaseAdmin, "produtos"),
      contar(supabaseAdmin, "usuarios"),
    ]);
    return NextResponse.json({ lojas, produtos, usuarios });
  } catch (e) {
    const message = e instanceof Error ? e.message : "count_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
