import { describe, expect, it } from "vitest";
import {
  normalizarTextoBusca,
  produtoCorrespondeTermoBusca,
  pontuacaoBuscaProduto,
  variantesTokenBusca,
} from "@/lib/buscaProdutos";

const fraldaCaes = {
  nome: "Fralda para Cães - 6 a 13kg - M",
  categoria: "pet shop",
  descricao: "Fralda descartável para cães de porte médio.",
};

describe("buscaProdutos", () => {
  it("normaliza acentos e caixa", () => {
    expect(normalizarTextoBusca("Cães")).toBe("caes");
    expect(normalizarTextoBusca("  Fralda   para  ")).toBe("fralda para");
  });

  it("expande sinônimos de cachorro e cão", () => {
    const vars = variantesTokenBusca("cachorro");
    expect(vars).toContain("caes");
    expect(vars).toContain("cao");
  });

  it('encontra "fralda para cães" ao buscar "fralda para cachorro"', () => {
    expect(produtoCorrespondeTermoBusca(fraldaCaes, "fralda para cachorro")).toBe(true);
    expect(produtoCorrespondeTermoBusca(fraldaCaes, "fralda para cao")).toBe(true);
  });

  it('encontra com busca parcial "fralda para"', () => {
    expect(produtoCorrespondeTermoBusca(fraldaCaes, "fralda para")).toBe(true);
  });

  it("não retorna produto sem relação com a consulta", () => {
    expect(produtoCorrespondeTermoBusca(fraldaCaes, "ração gatos")).toBe(false);
  });

  it("prioriza correspondência mais forte no nome", () => {
    const scoreCachorro = pontuacaoBuscaProduto(fraldaCaes, "fralda para cachorro");
    const scoreGenerico = pontuacaoBuscaProduto(fraldaCaes, "pet");
    expect(scoreCachorro).toBeGreaterThan(scoreGenerico);
  });
});
