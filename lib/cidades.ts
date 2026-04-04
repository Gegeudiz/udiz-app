export const CIDADES_DISPONIVEIS = [
  "Uberlândia/MG",
  "Brasília/DF",
  "São Paulo",
  "Belo Horizonte",
  "Rio de Janeiro",
] as const;
const CIDADE_STORAGE_KEY = "udiz_cidade";

function norm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function enderecoEhDaCidade(endereco: string | null | undefined, cidade: string): boolean {
  if (!cidade) return true;
  const e = norm(endereco ?? "");
  const c = norm(cidade);

  // Aceita endereço contendo "Uberlandia" mesmo que a opção seja "Uberlândia/MG".
  const cidadeBase = c.split("/")[0]?.trim() ?? c;
  if (cidadeBase && e.includes(cidadeBase)) return true;

  // Fallback: tenta o texto completo selecionado.
  return e.includes(c);
}

export function readCidadeSelecionada(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(CIDADE_STORAGE_KEY) ?? "";
}

export function writeCidadeSelecionada(cidade: string) {
  if (typeof window === "undefined") return;
  if (!cidade) {
    localStorage.removeItem(CIDADE_STORAGE_KEY);
  } else {
    localStorage.setItem(CIDADE_STORAGE_KEY, cidade);
  }
  window.dispatchEvent(new Event("udiz:cidade-changed"));
}
