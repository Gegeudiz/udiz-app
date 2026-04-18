/**
 * Lista oficial de categorias do Udiz (catálogo + filtros + busca).
 * Valores antigos no banco são mapeados em {@link produtoPassaNoFiltroCategoria}.
 */
export const CATEGORIAS_UDIZ = [
  "Brinquedos/Jogos",
  "Esporte/Suplementos",
  "Cosméticos/Produtos de beleza",
  "joias/semijoias",
  "Escritório/Escola",
  "Casa/Decoração",
  "Ferramentas/ Ferragista/ Construção",
  "Tecnologia/eletrônicos",
  "pet shop",
  "perfumaria",
  "mercearia",
  "festas",
  "Outros",
] as const;

export type CategoriaUdiz = (typeof CATEGORIAS_UDIZ)[number];

/** Categorias exatas usadas antes da consolidação (produtos já cadastrados). */
const LEGACY_POR_CATEGORIA: Record<string, readonly string[]> = {
  "Brinquedos/Jogos": ["Brinquedos"],
  "Esporte/Suplementos": ["Esporte"],
  "Cosméticos/Produtos de beleza": ["Cosméticos"],
  "joias/semijoias": [],
  "Escritório/Escola": ["Escritório", "Escola"],
  "Casa/Decoração": ["Casa", "Casa/Jardim", "Decoração"],
  "Ferramentas/ Ferragista/ Construção": [
    "Ferragista",
    "Ferramentas/Ferragista",
    "Construção",
  ],
  "Tecnologia/eletrônicos": ["Eletrônicos"],
  "pet shop": ["Pet"],
  perfumaria: ["Perfumaria", "PERFUMARIA"],
  mercearia: ["Mercearia", "MERCEARIA"],
  festas: ["Festas", "FESTAS"],
  Outros: ["Outros"],
};

function normalizeCategoria(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Mesma heurística antiga do filtro “Ferragista” (texto livre no campo categoria). */
function correspondeTextoFerramentasConstrucao(categoriaProduto: string): boolean {
  const cat = normalizeCategoria(categoriaProduto);
  return (
    cat.includes("ferragista") ||
    cat.includes("ferrament") ||
    cat.includes("construc") ||
    cat.includes("construç")
  );
}

/**
 * Indica se o produto deve aparecer quando o usuário filtra por `filtroCategoria`.
 * Considera o rótulo novo, valores legados e a heurística de ferramentas/construção.
 */
export function produtoPassaNoFiltroCategoria(
  categoriaProduto: string,
  filtroCategoria: string,
): boolean {
  const filtro = filtroCategoria.trim();
  if (!filtro) return true;

  const prod = categoriaProduto.trim();
  if (prod === filtro) return true;

  const legados = LEGACY_POR_CATEGORIA[filtro];
  if (legados?.some((l) => prod === l)) return true;

  if (
    filtro === "Ferramentas/ Ferragista/ Construção" &&
    correspondeTextoFerramentasConstrucao(prod)
  ) {
    return true;
  }

  return false;
}

/** Links antigos da busca (?categoria=…) ainda usados em favoritos ou histórico. */
const CATEGORIA_QUERY_LEGACY: Record<string, string> = {
  Brinquedos: "Brinquedos/Jogos",
  Esporte: "Esporte/Suplementos",
  Cosméticos: "Cosméticos/Produtos de beleza",
  Escritório: "Escritório/Escola",
  Escola: "Escritório/Escola",
  "Casa/Jardim": "Casa/Decoração",
  Casa: "Casa/Decoração",
  Decoração: "Casa/Decoração",
  Festas: "festas",
  Pet: "pet shop",
  Ferragista: "Ferramentas/ Ferragista/ Construção",
  Construção: "Ferramentas/ Ferragista/ Construção",
  "Ferramentas/Ferragista": "Ferramentas/ Ferragista/ Construção",
  Eletrônicos: "Tecnologia/eletrônicos",
  Outros: "Outros",
};

export function normalizaParametroCategoriaDaUrl(valor: string): string {
  const t = valor.trim();
  if (!t) return "";
  return CATEGORIA_QUERY_LEGACY[t] ?? t;
}

/** Converte valor salvo no produto (possivelmente legado) para um rótulo da lista atual. */
export function migrarRotuloCategoriaArmazenada(valor: string): string {
  const t = valor.trim();
  if (!t) return "";
  for (const nova of CATEGORIAS_UDIZ) {
    const legados = LEGACY_POR_CATEGORIA[nova];
    if (t === nova || (legados && legados.includes(t))) return nova;
  }
  return t;
}
