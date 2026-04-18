"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import BotaoSalvarProduto from "@/components/BotaoSalvarProduto";
import {
  PRODUCT_CARD_GRID_CLASS,
  PRODUCT_CARD_SURFACE_INTERACTIVE_CLASS,
  ProductCardImageArea,
  ProductCardNome,
  ProductCardNomeLoja,
  ProductCardPreco,
} from "@/components/ProductCardLayout";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ModalLogin from "@/components/ModalLogin";
import { useCatalog } from "@/contexts/CatalogContext";
import { findLojaById } from "@/lib/catalogo";
import { rotuloLocalPublicoLoja } from "@/lib/enderecoLoja";
import {
  CIDADES_DISPONIVEIS,
  lojaCorrespondeCidadeFiltrada,
  readCidadeSelecionada,
  writeCidadeSelecionada,
} from "@/lib/cidades";
import type { Usuario } from "@/lib/types";
import { readUsuario, refreshUsuarioFromSupabaseSession } from "@/lib/usuario";
import {
  CATEGORIAS_UDIZ,
  normalizaParametroCategoriaDaUrl,
  produtoPassaNoFiltroCategoria,
} from "@/lib/categoriasUdiz";

function BuscaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";
  const catParam = searchParams.get("categoria") ?? "";
  const cidadeParam = searchParams.get("cidade") ?? "";

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [abrirLogin, setAbrirLogin] = useState(false);
  const [termo, setTermo] = useState(qParam);
  const [categoria, setCategoria] = useState(catParam);
  const [cidade, setCidade] = useState(cidadeParam);
  const { lojas, produtos, loading, error: catalogError } = useCatalog();
  const erro = catalogError ?? "";

  useEffect(() => {
    void refreshUsuarioFromSupabaseSession().then(() => setUsuario(readUsuario()));
  }, []);

  useEffect(() => {
    const onPerfil = () => {
      void refreshUsuarioFromSupabaseSession().then(() => setUsuario(readUsuario()));
    };
    window.addEventListener("udiz:usuario-atualizado", onPerfil);
    return () => window.removeEventListener("udiz:usuario-atualizado", onPerfil);
  }, []);

  useEffect(() => {
    const catNorm = normalizaParametroCategoriaDaUrl(catParam);
    setTermo(qParam);
    setCategoria(catNorm);
    if (catParam && catNorm !== catParam) {
      const p = new URLSearchParams();
      if (qParam) p.set("q", qParam);
      p.set("categoria", catNorm);
      if (cidadeParam) p.set("cidade", cidadeParam);
      const qs = p.toString();
      router.replace(`/busca?${qs}`);
    }
    setCidade(cidadeParam || readCidadeSelecionada());
  }, [qParam, catParam, cidadeParam, router]);

  useEffect(() => {
    writeCidadeSelecionada(cidade);
  }, [cidade]);

  const filtrados = useMemo(() => {
    const t = termo.trim().toLowerCase();
    return produtos.filter((p) => {
      const loja = findLojaById(lojas, p.loja_id);
      const matchCidade = !cidade || lojaCorrespondeCidadeFiltrada(loja, cidade);
      const matchCat = produtoPassaNoFiltroCategoria(p.categoria, categoria);
      const matchNome =
        !t ||
        p.nome.toLowerCase().includes(t) ||
        p.categoria.toLowerCase().includes(t) ||
        p.descricao.toLowerCase().includes(t);
      return matchCidade && matchCat && matchNome;
    });
  }, [produtos, lojas, termo, categoria, cidade]);

  const aplicarFiltros = () => {
    const params = new URLSearchParams();
    if (termo.trim()) params.set("q", termo.trim());
    if (categoria) params.set("categoria", categoria);
    if (cidade) params.set("cidade", cidade);
    const qs = params.toString();
    router.push(qs ? `/busca?${qs}` : "/busca");
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-100">
      <Header
        usuario={usuario}
        abrirLogin={() => setAbrirLogin(true)}
        onLogout={() => setUsuario(null)}
      />

      <div className="w-full min-w-0 max-w-full box-border pt-36 pb-24 md:pb-10 px-4 sm:px-5 md:px-8 md:pt-32 lg:pt-36">
        <div className="max-w-6xl mx-auto w-full min-w-0 md:mt-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 scroll-mt-32">
            {categoria ? `Buscar em: ${categoria}` : "Buscar produtos"}
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Veja onde encontrar perto de você. Informações dos produtos, dados das lojas cadastradas no Udiz e muito mais.
          </p>

          <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-col md:flex-row md:flex-wrap gap-3 min-w-0 w-full max-w-full">
            <input
              type="text"
              placeholder="O que você procura?"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              className="w-full min-w-0 flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            />
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full min-w-0 md:w-48 md:max-w-[12rem] shrink-0 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            >
              <option value="">Todas as categorias</option>
              {CATEGORIAS_UDIZ.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full min-w-0 md:w-56 md:max-w-[14rem] shrink-0 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              aria-label="Filtrar por cidade"
            >
              <option value="">Todas as cidades</option>
              {CIDADES_DISPONIVEIS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={aplicarFiltros}
              className="w-full md:w-auto shrink-0 bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Buscar
            </button>
          </div>

          {loading ? (
            <p className="text-gray-600">Carregando produtos...</p>
          ) : erro ? (
            <p className="text-red-600">{erro}</p>
          ) : filtrados.length === 0 ? (
            <p className="text-gray-600">
              Nenhum produto encontrado. Cadastre produtos no Udiz Estoque ou ajuste os filtros.
            </p>
          ) : (
            <ul className={`${PRODUCT_CARD_GRID_CLASS} w-full list-none p-0 m-0`}>
              {filtrados.map((p) => {
                const loja = findLojaById(lojas, p.loja_id);
                const locLabel = loja ? rotuloLocalPublicoLoja(loja) || loja.endereco : "";
                return (
                  <li key={p.id} className="min-w-0">
                    <Link
                      href={`/produto/${encodeURIComponent(p.id)}`}
                      className={`relative block max-w-full ${PRODUCT_CARD_SURFACE_INTERACTIVE_CLASS}`}
                    >
                      <BotaoSalvarProduto
                        produtoId={p.id}
                        usuario={usuario}
                        onPrecisaLogin={() => setAbrirLogin(true)}
                        className="absolute top-1 right-1 z-10"
                      />
                      <ProductCardImageArea src={p.imagem} alt={p.nome} />
                      <p className="text-xs text-gray-500">{p.categoria}</p>
                      <ProductCardNome>{p.nome}</ProductCardNome>
                      <ProductCardPreco valor={Number(p.preco)} />
                      <ProductCardNomeLoja>{loja?.nome ?? "Loja"}</ProductCardNomeLoja>
                      {locLabel ? (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{locLabel}</p>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <BottomNav />

      <ModalLogin
        aberto={abrirLogin}
        fechar={() => setAbrirLogin(false)}
        onLogin={(user) => setUsuario(user)}
      />
    </div>
  );
}

export default function BuscaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full overflow-x-hidden bg-gray-100 pt-32 px-4 md:pt-28">
          <p className="text-gray-600 max-w-6xl mx-auto">Carregando busca...</p>
        </div>
      }
    >
      <BuscaContent />
    </Suspense>
  );
}
