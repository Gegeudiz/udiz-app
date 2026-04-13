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

/**
 * wa.me interpreta o prefixo como código de país (ex.: 349… vira +34 Espanha).
 * Lojistas brasileiros costumam salvar só DDD + número (10 ou 11 dígitos) — aí falta o 55.
 * - 10 dígitos → assume BR (fixo / formato local).
 * - 11 dígitos com o 3º dígito 9 → celular BR (DDD + 9 + 8 dígitos).
 * - Já começa com 55 e tem tamanho internacional → mantém.
 * - Outros 11 dígitos → mantém (ex.: +34… digitado cheio) para não quebrar exterior.
 */
export function normalizeWhatsAppNumberForWaMe(raw: string): string {
  const n = onlyDigits(raw).replace(/^0+/, "");
  if (!n) return "";
  if (n.startsWith("55") && n.length >= 12) return n;
  if (n.length === 10) return `55${n}`;
  if (n.length === 11 && n[2] === "9") return `55${n}`;
  return n;
}

export function whatsappHref(whatsapp: string, message?: string): string {
  const n = normalizeWhatsAppNumberForWaMe(whatsapp);
  if (!n) return "#";
  const base = `https://wa.me/${n}`;
  if (message) return `${base}?text=${encodeURIComponent(message)}`;
  return base;
}

