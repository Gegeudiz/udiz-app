"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { fetchAdminDashboardStats, type AdminDashboardStats } from "@/lib/admin/fetchDashboardStats";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const CARD_STYLES = [
  {
    label: "Lojas cadastradas",
    icon: "🏪",
    ring: "ring-orange-200",
    bg: "bg-gradient-to-br from-orange-50 to-white",
    value: "text-orange-700",
  },
  {
    label: "Produtos cadastrados",
    icon: "📦",
    ring: "ring-purple-200",
    bg: "bg-gradient-to-br from-purple-50 to-white",
    value: "text-purple-700",
  },
  {
    label: "Usuários no Udiz",
    icon: "👥",
    ring: "ring-violet-200",
    bg: "bg-gradient-to-br from-violet-50 to-white",
    value: "text-violet-700",
  },
] as const;

function StatCard({
  label,
  value,
  hint,
  icon,
  ring,
  bg,
  valueClass,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  ring: string;
  bg: string;
  valueClass: string;
}) {
  return (
    <section className={`rounded-2xl border border-gray-100 p-5 shadow-sm ring-1 ${ring} ${bg}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
      </div>
      <p className={`mt-3 text-4xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-gray-500">{hint}</p> : null}
    </section>
  );
}

export default function AdminDashboard() {
  const { usuario, loadingAuth, isAdmin } = useAdminAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [erroStats, setErroStats] = useState("");

  useEffect(() => {
    if (loadingAuth || !isAdmin) return;
    let cancelled = false;
    void (async () => {
      setLoadingStats(true);
      setErroStats("");
      try {
        const supabase = createSupabaseBrowserClient();
        const data = await fetchAdminDashboardStats(supabase);
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setErroStats("Não foi possível carregar os totais do Udiz.");
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadingAuth, isAdmin]);

  if (loadingAuth) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-50 to-gray-100 px-4 py-12">
        <section className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600 shadow-sm">
          Verificando acesso administrativo...
        </section>
      </main>
    );
  }

  if (!isAdmin) return null;

  const valores = [
    loadingStats ? "…" : String(stats?.lojas ?? 0),
    loadingStats ? "…" : String(stats?.produtos ?? 0),
    loadingStats
      ? "…"
      : stats?.usuariosIndisponivel
        ? "—"
        : String(stats?.usuarios ?? 0),
  ];

  const hints = [
    undefined,
    undefined,
    stats?.usuariosIndisponivel
      ? "No Supabase SQL Editor, cole o conteúdo de supabase/scripts/COLE_NO_SQL_EDITOR.sql e clique Run."
      : "Cadastros no Udiz",
  ];

  return (
    <AdminShell
      titulo="Painel de gestão"
      subtitulo="Visão geral do Udiz: cadastros, lojas e produtos no sistema."
      usuario={usuario}
    >
      {erroStats ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {erroStats}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        {CARD_STYLES.map((card, i) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={valores[i]}
            hint={hints[i]}
            icon={card.icon}
            ring={card.ring}
            bg={card.bg}
            valueClass={card.value}
          />
        ))}
      </section>

      <section className="mt-8 space-y-4">
        <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/50 p-5">
          <h2 className="text-sm font-semibold text-purple-900">Destaques na página inicial</h2>
          <p className="mt-1 text-sm text-purple-800/80">
            Escolha quais produtos aparecem em &quot;Produtos em Destaque&quot; em cada cidade.
          </p>
          <Link
            href="/admin/destaques"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-purple-600 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-md shadow-purple-600/25 transition-colors hover:bg-purple-700 sm:w-auto"
          >
            Gerir produtos em destaque
          </Link>
        </div>

        <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/50 p-5">
          <h2 className="text-sm font-semibold text-purple-900">Transferência de loja</h2>
          <p className="mt-1 text-sm text-purple-800/80">
            Transfira a titularidade de uma loja entre contas de usuários.
          </p>
          <Link
            href="/admin/transferencia-lojas?acao=transferir"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-purple-300 bg-white px-5 py-3.5 text-center text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-50 sm:w-auto"
          >
            Transferir Loja de uma conta para outra
          </Link>
        </div>
      </section>
    </AdminShell>
  );
}
