import { favoritoRepo } from "@/lib/repositories/localDb";

export function getSalvosIds(userId: string): string[] {
  return favoritoRepo.listByUser(userId);
}

export function isProdutoSalvo(userId: string, produtoId: string): boolean {
  return favoritoRepo.isSaved(userId, produtoId);
}

/** Retorna se o produto ficou salvo após o toggle. */
export function toggleProdutoSalvo(userId: string, produtoId: string): boolean {
  return favoritoRepo.toggle(userId, produtoId);
}

