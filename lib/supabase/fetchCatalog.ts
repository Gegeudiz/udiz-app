import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapLoja, mapProduto, type LojaRow, type ProdutoRow } from "@/lib/supabase/mapRows";
import type { Loja, Produto } from "@/lib/types";

export async function fetchLojasFromSupabase(): Promise<Loja[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("lojas").select("*").order("nome");
  if (error) throw error;
  return (data as LojaRow[]).map(mapLoja);
}

export async function fetchProdutosFromSupabase(): Promise<Produto[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("produtos").select("*").order("nome");
  if (error) throw error;
  return (data as ProdutoRow[]).map(mapProduto);
}

export async function fetchLojaByIdFromSupabase(id: string): Promise<Loja | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("lojas").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapLoja(data as LojaRow);
}

export async function fetchProdutoByIdFromSupabase(id: string): Promise<Produto | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("produtos").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProduto(data as ProdutoRow);
}

export async function fetchCatalogFromSupabase(): Promise<{ lojas: Loja[]; produtos: Produto[] }> {
  const [lojas, produtos] = await Promise.all([
    fetchLojasFromSupabase(),
    fetchProdutosFromSupabase(),
  ]);
  return { lojas, produtos };
}
