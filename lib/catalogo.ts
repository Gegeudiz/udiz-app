import { lojaRepo, produtoRepo } from "@/lib/repositories/localDb";
import type { Loja, Produto } from "./types";

export function getLojasFromStorage(): Loja[] {
  return lojaRepo.list();
}

export function getProdutosFromStorage(): Produto[] {
  return produtoRepo.list();
}

export function findLojaById(lojas: Loja[], id: string): Loja | undefined {
  return lojas.find((l) => l.id === id);
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function whatsappHref(whatsapp: string, message?: string): string {
  const n = onlyDigits(whatsapp);
  if (!n) return "#";
  const base = `https://wa.me/${n}`;
  if (message) return `${base}?text=${encodeURIComponent(message)}`;
  return base;
}

