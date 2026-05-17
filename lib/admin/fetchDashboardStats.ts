import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminDashboardStats = {
  lojas: number;
  produtos: number;
  usuarios: number;
  usuariosIndisponivel: boolean;
};

type RpcStats = {
  lojas?: number;
  produtos?: number;
  usuarios?: number;
};

async function contarTabela(
  supabase: SupabaseClient,
  tabela: "lojas" | "produtos",
): Promise<number> {
  const { count, error } = await supabase.from(tabela).select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

async function fetchStatsViaApi(accessToken: string): Promise<AdminDashboardStats | null> {
  const res = await fetch("/api/admin/stats", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { lojas?: number; produtos?: number; usuarios?: number };
  return {
    lojas: Number(body.lojas ?? 0),
    produtos: Number(body.produtos ?? 0),
    usuarios: Number(body.usuarios ?? 0),
    usuariosIndisponivel: false,
  };
}

/** Totais do painel admin (API server-side, RPC ou contagem parcial no cliente). */
export async function fetchAdminDashboardStats(supabase: SupabaseClient): Promise<AdminDashboardStats> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    const viaApi = await fetchStatsViaApi(session.access_token);
    if (viaApi) return viaApi;
  }

  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (!error && data && typeof data === "object") {
    const row = data as RpcStats;
    return {
      lojas: Number(row.lojas ?? 0),
      produtos: Number(row.produtos ?? 0),
      usuarios: Number(row.usuarios ?? 0),
      usuariosIndisponivel: false,
    };
  }

  const [lojas, produtos] = await Promise.all([
    contarTabela(supabase, "lojas"),
    contarTabela(supabase, "produtos"),
  ]);

  return {
    lojas,
    produtos,
    usuarios: 0,
    usuariosIndisponivel: true,
  };
}
