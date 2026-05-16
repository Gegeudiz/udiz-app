/** Texto pesquisável de um produto no catálogo público. */
export type TextoBuscaProduto = {
  nome: string;
  categoria: string;
  descricao: string;
};

/** Remove acentos e padroniza para comparação (minúsculas, espaços simples). */
export function normalizarTextoBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Palavras de ligação — não exigidas na correspondência token a token. */
const STOP_WORDS = new Set([
  "a",
  "as",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "por",
  "sem",
  "um",
  "uma",
  "uns",
  "umas",
]);

/**
 * Grupos de sinônimos comuns em buscas de varejo (PT-BR).
 * Qualquer termo do grupo pode corresponder a qualquer outro no mesmo grupo.
 */
const GRUPOS_SINONIMOS: readonly string[][] = [
  ["cachorro", "cachorros", "cao", "caes", "canino", "canina", "caninos", "caninas"],
  ["gato", "gatos", "felino", "felina", "felinos", "felinas"],
  ["filhote", "filhotes", "filhotinho", "filhotinhos"],
  ["bebe", "bebes", "infantil", "infantis", "recem", "nascido", "nascidos"],
  ["celular", "celulares", "smartphone", "smartphones", "telefone", "telefones", "móvel", "movel"],
  ["tv", "televisao", "televisão", "televisor", "televisores"],
  ["carro", "carros", "automovel", "automóvel", "automoveis", "automóveis", "veicular"],
  ["cachorro quente", "cachorro-quente", "hot dog", "hotdog"],
];

const SINONIMOS_POR_TERMO = new Map<string, string[]>();

for (const grupo of GRUPOS_SINONIMOS) {
  const normalizados = [...new Set(grupo.map((t) => normalizarTextoBusca(t)))];
  for (const termo of normalizados) {
    SINONIMOS_POR_TERMO.set(termo, normalizados);
  }
}

/** Variantes de um token (ele mesmo + sinônimos do mesmo grupo). */
export function variantesTokenBusca(token: string): string[] {
  const t = normalizarTextoBusca(token);
  if (!t) return [];
  const grupo = SINONIMOS_POR_TERMO.get(t);
  if (grupo) return grupo;
  return [t];
}

function tokenRelevante(token: string): boolean {
  const t = normalizarTextoBusca(token);
  if (!t) return false;
  if (STOP_WORDS.has(t)) return false;
  if (t.length >= 2) return true;
  return /\d/.test(t);
}

/** Quebra a consulta em tokens significativos para busca. */
export function tokensConsultaBusca(termo: string): string[] {
  const norm = normalizarTextoBusca(termo);
  if (!norm) return [];
  return norm.split(" ").filter(tokenRelevante);
}

function textoContemAlgumaVariante(texto: string, token: string): boolean {
  const variantes = variantesTokenBusca(token);
  return variantes.some((v) => texto.includes(v));
}

/**
 * Pontua relevância (0 = sem correspondência). Quanto maior, mais perto da intenção da busca.
 */
export function pontuacaoBuscaProduto(produto: TextoBuscaProduto, termo: string): number {
  const consulta = termo.trim();
  if (!consulta) return 1;

  const tokens = tokensConsultaBusca(consulta);
  const nome = normalizarTextoBusca(produto.nome);
  const categoria = normalizarTextoBusca(produto.categoria);
  const descricao = normalizarTextoBusca(produto.descricao);
  const textoCompleto = `${nome} ${categoria} ${descricao}`;

  if (tokens.length === 0) {
    const q = normalizarTextoBusca(consulta);
    return textoCompleto.includes(q) ? 5 : 0;
  }

  let pontos = 0;
  for (const token of tokens) {
    let achou = false;
    if (textoContemAlgumaVariante(nome, token)) {
      pontos += 12;
      achou = true;
    } else if (textoContemAlgumaVariante(categoria, token)) {
      pontos += 6;
      achou = true;
    } else if (textoContemAlgumaVariante(descricao, token)) {
      pontos += 3;
      achou = true;
    } else if (textoContemAlgumaVariante(textoCompleto, token)) {
      pontos += 1;
      achou = true;
    }
    if (!achou) return 0;
  }

  const consultaNorm = normalizarTextoBusca(consulta);
  if (nome.includes(consultaNorm) || textoCompleto.includes(consultaNorm)) {
    pontos += 8;
  }

  return pontos;
}

export function produtoCorrespondeTermoBusca(produto: TextoBuscaProduto, termo: string): boolean {
  return pontuacaoBuscaProduto(produto, termo) > 0;
}
