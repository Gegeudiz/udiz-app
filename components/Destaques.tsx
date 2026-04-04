"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BotaoSalvarProduto from "@/components/BotaoSalvarProduto";
import {
  PRODUCT_CARD_GRID_CLASS,
  PRODUCT_CARD_SURFACE_INTERACTIVE_CLASS,
  ProductCardImageArea,
  ProductCardNome,
  ProductCardNomeLoja,
  ProductCardPreco,
} from "@/components/ProductCardLayout";
import { useCatalog } from "@/contexts/CatalogContext";
import { findLojaById } from "@/lib/catalogo";
import { lojaCorrespondeCidadeFiltrada, readCidadeSelecionada } from "@/lib/cidades";
import type { Usuario } from "@/lib/types";

type Props = {
  usuario: Usuario | null;
  onPrecisaLogin: () => void;
};

export default function Destaques({ usuario, onPrecisaLogin }: Props) {
  /** Só depois do mount no cliente lemos localStorage — evita erro de hidratação SSR vs browser. */
  const [montado, setMontado] = useState(false);
  const [cidadeSelecionada, setCidadeSelecionada] = useState("");
  const { lojas, produtos, loading, error } = useCatalog();

  useEffect(() => {
    setMontado(true);
    const syncCidade = () => setCidadeSelecionada(readCidadeSelecionada());
    syncCidade();
    window.addEventListener("udiz:cidade-changed", syncCidade);
    window.addEventListener("storage", syncCidade);
    return () => {
      window.removeEventListener("udiz:cidade-changed", syncCidade);
      window.removeEventListener("storage", syncCidade);
    };
  }, []);

  const itens = useMemo(() => {
    if (!montado || loading) return [];
    const filtradosPorCidade = produtos.filter((p) => {
      const loja = findLojaById(lojas, p.loja_id);
      return lojaCorrespondeCidadeFiltrada(loja, cidadeSelecionada);
    });
    const slice = filtradosPorCidade.slice(0, 10);
    return slice.map((p) => {
      const loja = findLojaById(lojas, p.loja_id);
      return {
        produto: p,
        lojaNome: loja?.nome ?? "Loja",
        imagem: p.imagem || loja?.imagem || "https://picsum.photos/300/200",
      };
    });
  }, [montado, loading, cidadeSelecionada, lojas, produtos]);

  return (
    <section className="bg-gray-100 py-10 px-4">
      <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
        Produtos em Destaque
      </h2>

      {!montado || loading ? (
        <p className="text-center text-gray-500 text-sm max-w-md mx-auto">
          Carregando destaques...
        </p>
      ) : error ? (
        <p className="text-center text-red-600 text-sm max-w-md mx-auto">{error}</p>
      ) : itens.length === 0 ? (
        <p className="text-center text-gray-600 text-sm max-w-md mx-auto">
          Ainda não há produtos cadastrados. Quando lojistas adicionarem itens no Udiz Estoque, eles
          aparecerão aqui.{" "}
          <Link href="/busca" className="text-purple-600 font-medium hover:underline">
            Ver busca
          </Link>
        </p>
      ) : (
        <div className={PRODUCT_CARD_GRID_CLASS}>
          {itens.map(({ produto, lojaNome, imagem }) => (
            <div key={produto.id} className="relative min-w-0">
              <BotaoSalvarProduto
                produtoId={produto.id}
                usuario={usuario}
                onPrecisaLogin={onPrecisaLogin}
                className="absolute top-1 right-1 z-10"
              />
              <Link
                href={`/produto/${encodeURIComponent(produto.id)}`}
                className={PRODUCT_CARD_SURFACE_INTERACTIVE_CLASS}
              >
                <ProductCardImageArea src={imagem} alt={produto.nome} />
                <ProductCardNome>{produto.nome}</ProductCardNome>
                <ProductCardPreco valor={Number(produto.preco)} />
                <ProductCardNomeLoja>{lojaNome}</ProductCardNomeLoja>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
