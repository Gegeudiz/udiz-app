/**
 * Lista oficial de categorias do Udiz (catálogo + filtros + busca).
 * Valores antigos no banco são mapeados em {@link produtoPassaNoFiltroCategoria}.
 */
export const CATEGORIAS_UDIZ = [
  "Autos/ Motos/ Peças e Acessórios",
  "Brinquedos/Jogos",
  "Elétrica/ Luzes e Led",
  "Esporte/Suplementos",
  "Cosméticos/ Produtos de Beleza/ Perfumaria",
  "joias/semijoias",
  "Escritório/Escola",
  "Casa/ Decoração/ Cosinha/Sala/Quarto",
  "Ferramentas/ Ferragista/ Construção",
  "Tecnologia/ Eletrônicos/ Acessórios",
  "pet shop",
  "Utilidades/ Mercearia",
  "festas",
  "Outros",
] as const;

export type CategoriaUdiz = (typeof CATEGORIAS_UDIZ)[number];

/** Categorias exatas usadas antes da consolidação (produtos já cadastrados). */
const LEGACY_POR_CATEGORIA: Record<string, readonly string[]> = {
  "Autos/ Motos/ Peças e Acessórios": ["Autos", "Motos", "Peças e Acessórios"],
  "Brinquedos/Jogos": ["Brinquedos"],
  "Elétrica/ Luzes e Led": ["Elétrica", "Luzes", "Led", "Iluminação"],
  "Esporte/Suplementos": ["Esporte"],
  "Cosméticos/ Produtos de Beleza/ Perfumaria": [
    "Cosméticos",
    "Cosméticos/Produtos de beleza",
    "perfumaria",
    "Perfumaria",
    "PERFUMARIA",
  ],
  "joias/semijoias": [],
  "Escritório/Escola": ["Escritório", "Escola"],
  "Casa/ Decoração/ Cosinha/Sala/Quarto": [
    "Casa",
    "Casa/Decoração",
    "Casa/Jardim",
    "Decoração",
  ],
  "Ferramentas/ Ferragista/ Construção": [
    "Ferragista",
    "Ferramentas/Ferragista",
    "Construção",
  ],
  "Tecnologia/ Eletrônicos/ Acessórios": [
    "Tecnologia/eletrônicos",
    "Eletrônicos",
    "Acessórios",
  ],
  "pet shop": ["Pet"],
  "Utilidades/ Mercearia": ["mercearia", "Mercearia", "MERCEARIA"],
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
  Autos: "Autos/ Motos/ Peças e Acessórios",
  Motos: "Autos/ Motos/ Peças e Acessórios",
  "Peças e Acessórios": "Autos/ Motos/ Peças e Acessórios",
  Brinquedos: "Brinquedos/Jogos",
  Elétrica: "Elétrica/ Luzes e Led",
  Luzes: "Elétrica/ Luzes e Led",
  Led: "Elétrica/ Luzes e Led",
  Iluminação: "Elétrica/ Luzes e Led",
  Esporte: "Esporte/Suplementos",
  Cosméticos: "Cosméticos/ Produtos de Beleza/ Perfumaria",
  "Cosméticos/Produtos de beleza": "Cosméticos/ Produtos de Beleza/ Perfumaria",
  perfumaria: "Cosméticos/ Produtos de Beleza/ Perfumaria",
  Perfumaria: "Cosméticos/ Produtos de Beleza/ Perfumaria",
  PERFUMARIA: "Cosméticos/ Produtos de Beleza/ Perfumaria",
  Escritório: "Escritório/Escola",
  Escola: "Escritório/Escola",
  "Casa/Jardim": "Casa/ Decoração/ Cosinha/Sala/Quarto",
  Casa: "Casa/ Decoração/ Cosinha/Sala/Quarto",
  "Casa/Decoração": "Casa/ Decoração/ Cosinha/Sala/Quarto",
  Decoração: "Casa/ Decoração/ Cosinha/Sala/Quarto",
  Festas: "festas",
  Pet: "pet shop",
  Ferragista: "Ferramentas/ Ferragista/ Construção",
  Construção: "Ferramentas/ Ferragista/ Construção",
  "Ferramentas/Ferragista": "Ferramentas/ Ferragista/ Construção",
  "Tecnologia/eletrônicos": "Tecnologia/ Eletrônicos/ Acessórios",
  Eletrônicos: "Tecnologia/ Eletrônicos/ Acessórios",
  Acessórios: "Tecnologia/ Eletrônicos/ Acessórios",
  mercearia: "Utilidades/ Mercearia",
  Mercearia: "Utilidades/ Mercearia",
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
