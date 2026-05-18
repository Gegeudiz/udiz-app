import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapProduto, type ProdutoRow } from "@/lib/supabase/mapRows";

export async function setProdutoEmDestaque(
  produtoId: string,
  emDestaque: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("produtos")
    .update({ em_destaque: emDestaque })
    .eq("id", produtoId)
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message || "Não foi possível atualizar o destaque." };
  }
  if (!data) {
    return { ok: false, message: "Produto não encontrado ou sem permissão." };
  }

  mapProduto(data as ProdutoRow);
  return { ok: true };
}
