import type { Loja, Produto, Usuario } from "@/lib/types";

export function isAdminUser(user: Usuario | null | undefined): boolean {
  return user?.role === "admin" || user?.role === "super_admin";
}

export function canEditLoja(user: Usuario | null, loja: Loja | null | undefined): boolean {
  if (!user || !loja) return false;
  return loja.ownerId === user.id;
}

export function canEditProduto(user: Usuario | null, loja: Loja | null | undefined, produto: Produto | null | undefined): boolean {
  if (!user || !loja || !produto) return false;
  return loja.ownerId === user.id && produto.loja_id === loja.id;
}

