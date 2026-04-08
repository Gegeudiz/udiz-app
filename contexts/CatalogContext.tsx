"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchCatalogFromSupabase } from "@/lib/supabase/fetchCatalog";
import { getDataProvider } from "@/lib/repositories/provider";
import { lojaRepo, produtoRepo } from "@/lib/repositories/localDb";
import type { Loja, Produto } from "@/lib/types";

type CatalogValue = {
  lojas: Loja[];
  produtos: Produto[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  fonte: "local" | "supabase";
};

const CatalogContext = createContext<CatalogValue | null>(null);

/** Evita que o catálogo fique “Carregando…” para sempre se o Supabase não responder (rede/firewall). */
const CATALOG_FETCH_TIMEOUT_MS = 25_000;

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fonte = getDataProvider();

  const carregar = useCallback(() => {
    if (fonte === "supabase") {
      setLoading(true);
      setError(null);
      const timeout = new Promise<never>((_, reject) => {
        window.setTimeout(() => {
          reject(
            new Error(
              "Tempo esgotado ao conectar ao Supabase. Verifique internet, firewall, VPN e se NEXT_PUBLIC_SUPABASE_URL está correta no .env.local. Tente também http://127.0.0.1:3000 no navegador.",
            ),
          );
        }, CATALOG_FETCH_TIMEOUT_MS);
      });
      Promise.race([fetchCatalogFromSupabase(), timeout])
        .then(({ lojas: l, produtos: p }) => {
          setLojas(l);
          setProdutos(p);
        })
        .catch((e: Error) => {
          setError(e.message ?? "Erro ao carregar catálogo.");
          setLojas([]);
          setProdutos([]);
        })
        .finally(() => setLoading(false));
      return;
    }
    setLojas(lojaRepo.list());
    setProdutos(produtoRepo.list());
    setLoading(false);
    setError(null);
  }, [fonte]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    const onAtualizar = () => carregar();
    window.addEventListener("udiz:catalogo-atualizado", onAtualizar);
    return () => window.removeEventListener("udiz:catalogo-atualizado", onAtualizar);
  }, [carregar]);

  const value = useMemo<CatalogValue>(
    () => ({
      lojas,
      produtos,
      loading,
      error,
      refresh: carregar,
      fonte,
    }),
    [lojas, produtos, loading, error, carregar, fonte]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog deve ser usado dentro de CatalogProvider (rotas públicas).");
  }
  return ctx;
}
