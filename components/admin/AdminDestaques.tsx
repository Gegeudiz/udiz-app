"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import { setProdutoEmDestaque } from "@/lib/admin/setProdutoDestaque";
import { findLojaById } from "@/lib/catalogo";
import { CIDADES_DISPONIVEIS, lojaCorrespondeCidadeFiltrada } from "@/lib/cidades";
import { useCatalog } from "@/contexts/CatalogContext";

export default function AdminDestaques() {
  const { usuario, loadingAuth, isAdmin } = useAdminAuth();
  const { lojas, produtos, loading, error, refresh } = useCatalog();
  const [cidadeFiltro, setCidadeFiltro] = useState("");
  const [busca, setBusca] = useState("");
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [erroLocal, setErroLocal] = useState("");

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return produtos
      .filter((p) => {
        const loja = findLojaById(lojas, p.loja_id);
        if (!lojaCorrespondeCidadeFiltrada(loja, cidadeFiltro)) return false;
        if (!t) return true;
        const lojaNome = loja?.nome ?? "";
        return (
          p.nome.toLowerCase().includes(t) ||
          lojaNome.toLowerCase().includes(t) ||
          p.categoria.toLowerCase().includes(t)
        );
      })
      .sort((a, b) => {
        if (Boolean(a.em_destaque) !== Boolean(b.em_destaque)) {
          return a.em_destaque ? -1 : 1;
        }
        return a.nome.localeCompare(b.nome, "pt-BR");
      });
  }, [produtos, lojas, cidadeFiltro, busca]);

  const totalDestaquesCidade = useMemo(() => {
    return produtos.filter((p) => {
      if (!p.em_destaque) return false;
      const loja = findLojaById(lojas, p.loja_id);
      return lojaCorrespondeCidadeFiltrada(loja, cidadeFiltro);
    }).length;
  }, [produtos, lojas, cidadeFiltro]);

  const toggleDestaque = async (produtoId: string, atual: boolean) => {
    setErroLocal("");
    setSalvandoId(produtoId);
    const r = await setProdutoEmDestaque(produtoId, !atual);
    setSalvandoId(null);
    if (!r.ok) {
      setErroLocal(r.message);
      return;
    }
    refresh();
    window.dispatchEvent(new Event("udiz:catalogo-atualizado"));
  };

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

  return (
    <AdminShell
      titulo="Gerir destaques"
      subtitulo="Marque os produtos que aparecem na home. Cada destaque vale para a cidade da loja do produto."
      usuario={usuario}
      voltarAdmin
    >
      {erroLocal ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {erroLocal}
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </p>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          placeholder="Buscar por nome, loja ou categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={cidadeFiltro}
          onChange={(e) => setCidadeFiltro(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          aria-label="Filtrar por cidade"
        >
          <option value="">Todas as cidades</option>
          {CIDADES_DISPONIVEIS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        {cidadeFiltro ? (
          <>
            <strong>{totalDestaquesCidade}</strong> produto(s) em destaque em{" "}
            <strong>{cidadeFiltro}</strong> (máx. 10 na home).
          </>
        ) : (
          <>Selecione uma cidade para ver quantos destaques ela tem na home.</>
        )}
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Carregando produtos...</p>
      ) : lista.length === 0 ? (
        <p className="text-sm text-gray-600">Nenhum produto encontrado com esses filtros.</p>
      ) : (
        <ul className="max-h-[28rem] space-y-2 overflow-y-auto rounded-xl border border-gray-200">
          {lista.map((p) => {
            const loja = findLojaById(lojas, p.loja_id);
            const emDestaque = Boolean(p.em_destaque);
            const salvando = salvandoId === p.id;
            return (
              <li
                key={p.id}
                className={`flex items-start gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 ${
                  emDestaque ? "bg-purple-50/80" : "bg-white"
                }`}
              >
                <label className="flex shrink-0 cursor-pointer items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    checked={emDestaque}
                    disabled={salvando}
                    onChange={() => void toggleDestaque(p.id, emDestaque)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="sr-only">Destaque na home</span>
                </label>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{p.nome}</p>
                  <p className="text-xs text-gray-500">
                    {loja?.nome ?? "Loja"} · {loja?.cidade || "Cidade não informada"} · R${" "}
                    {Number(p.preco).toFixed(2)}
                  </p>
                </div>
                {salvando ? (
                  <span className="text-xs text-purple-600">Salvando...</span>
                ) : emDestaque ? (
                  <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                    Destaque
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-xs text-gray-500">
        Também é possível marcar no Supabase: tabela <strong>produtos</strong>, coluna{" "}
        <strong>em_destaque</strong> (checkbox). Rode o script{" "}
        <code className="rounded bg-gray-100 px-1">supabase/scripts/COLE_DESTAQUE_PRODUTOS.sql</code> se
        a coluna ainda não existir.
      </p>
    </AdminShell>
  );
}
