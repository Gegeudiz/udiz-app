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

export type EnderecoExtraidoGoogleMaps = {
  cidade: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
};

/** Tenta extrair campos estruturados a partir de um endereço copiado do Google Maps. */
export function extrairEnderecoGoogleMaps(raw: string): EnderecoExtraidoGoogleMaps | null {
  const texto = raw.replace(/\s+/g, " ").trim();
  if (!texto) return null;

  const semPais = texto.replace(/,\s*brasil$/i, "").trim();
  const partes = semPais
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (partes.length === 0) return null;

  const logradouro = partes[0] ?? "";
  let numero = "";
  let complemento = "";
  let bairro = "";
  let cidade = "";

  const cepRegex = /^\d{5}-?\d{3}$/;
  const partesSemCep = partes.filter((p) => !cepRegex.test(p));

  const parteCidade = partesSemCep.find((p) => /\s-\s[A-Z]{2}\b/.test(p)) ?? "";
  cidade = parteCidade ? parteCidade.split(/\s-\s[A-Z]{2}\b/)[0].trim() : "";

  if (partesSemCep.length >= 2) {
    const parteNumero = partesSemCep[1] ?? "";
    const pedacos = parteNumero
      .split(" - ")
      .map((x) => x.trim())
      .filter(Boolean);
    numero = pedacos[0] ?? "";
    if (pedacos.length >= 2) {
      bairro = pedacos[pedacos.length - 1] ?? "";
      const comp = pedacos.slice(1, -1).join(" - ").trim();
      complemento = comp;
    }
  }

  if (!cidade && partesSemCep.length >= 2) {
    const penultima = partesSemCep[partesSemCep.length - 1] ?? "";
    cidade = penultima.split(" - ")[0]?.trim() ?? "";
  }

  // fallback: se não conseguiu número pelo 2º bloco, tenta achar no logradouro.
  if (!numero) {
    const m = logradouro.match(/\b(\d+[A-Za-z0-9/-]*|S\/N|SN)\b/i);
    if (m?.[1]) numero = m[1];
  }

  if (!logradouro || !numero || !cidade) return null;

  return {
    cidade,
    bairro,
    logradouro,
    numero,
    complemento,
  };
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
