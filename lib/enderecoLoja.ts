import type { Loja } from "@/lib/types";

/** Monta uma linha única boa para busca no Google Maps (Brasil). */
export function montarEnderecoParaGoogleMaps(p: {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
}): string {
  const log = p.logradouro.trim();
  const num = p.numero.trim();
  const comp = p.complemento.trim();
  const bai = p.bairro.trim();
  const cid = p.cidade.trim();

  const ruaPart = [log, num || null].filter(Boolean).join(", ");
  const parts = [ruaPart, comp || null, bai, cid, "Brasil"].filter(
    (x): x is string => Boolean(x && x.length > 0)
  );
  return parts.join(", ");
}

/** Texto curto na ficha do produto / cards: bairro e cidade (sem rua/número). */
export function rotuloLocalPublicoLoja(loja: Loja | null | undefined): string {
  if (!loja) return "";
  const b = loja.bairro?.trim();
  const c = loja.cidade?.trim();
  if (b && c) return `${b}, ${c}`;
  if (c) return c;
  if (b) return b;
  return "";
}

/** Query completa para o Google Maps (usa endereco já montado no cadastro). */
export function queryGoogleMapsLoja(loja: Loja | null | undefined): string {
  return (loja?.endereco ?? "").trim();
}

/** Atualiza `endereco` a partir dos campos estruturados quando todos obrigatórios estão preenchidos. */
export function lojaComEnderecoMapsAtualizado(loja: Loja): Loja {
  const cidade = loja.cidade?.trim() ?? "";
  const bairro = loja.bairro?.trim() ?? "";
  const logradouro = loja.logradouro?.trim() ?? "";
  const numero = loja.numero?.trim() ?? "";
  if (cidade && bairro && logradouro && numero) {
    return {
      ...loja,
      endereco: montarEnderecoParaGoogleMaps({
        logradouro,
        numero,
        complemento: loja.complemento ?? "",
        bairro,
        cidade,
      }),
    };
  }
  return loja;
}
