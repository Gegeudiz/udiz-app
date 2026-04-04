import type { Produto } from "@/lib/types";

const MS_POR_DIA = 86400000;

/** True se `updated_at` (ou `created_at` como fallback) está dentro dos últimos `dias` — ex.: selo na ficha do produto. */
export function produtoAtualizadoNosUltimosDias(produto: Produto, dias = 15): boolean {
  const iso = produto.updated_at?.trim() || produto.created_at?.trim();
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= dias * MS_POR_DIA;
}
