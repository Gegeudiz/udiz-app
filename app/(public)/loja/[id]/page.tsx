"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import ModalLogin from "@/components/ModalLogin";
import { useCatalog } from "@/contexts/CatalogContext";
import { findLojaById, whatsappHref } from "@/lib/catalogo";
import { queryGoogleMapsLoja, rotuloLocalPublicoLoja } from "@/lib/enderecoLoja";
import {
  fetchLojaByIdFromSupabase,
  fetchProdutosDaLojaFromSupabase,
} from "@/lib/supabase/fetchCatalog";
import type { Loja, Produto, Usuario } from "@/lib/types";
import { trackEvent } from "@/lib/telemetry";
import { readUsuario, refreshUsuarioFromSupabaseSession } from "@/lib/usuario";
import {
  PRODUCT_CARD_GRID_CLASS,
  PRODUCT_CARD_SURFACE_INTERACTIVE_CLASS,
  ProductCardImageArea,
  ProductCardNome,
  ProductCardPreco,
} from "@/components/ProductCardLayout";

export default function LojaPublicaPage() {
  const params = useParams();
  const idParam = params?.id;
  const lojaId = Array.isArray(idParam) ? idParam[0] : idParam;
  const lojaIdStr = lojaId ? decodeURIComponent(String(lojaId)) : "";

  const { lojas, produtos, loading: catalogLoading, fonte } = useCatalog();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [abrirLogin, setAbrirLogin] = useState(false);
  const [loja, setLoja] = useState<Loja | null>(null);
  const [listaProdutos, setListaProdutos] = useState<Produto[]>([]);
  const [carregandoExtra, setCarregandoExtra] = useState(false);

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

  const lojaDoCatalogo = useMemo(
    () => (lojaIdStr ? findLojaById(lojas, lojaIdStr) : undefined),
    [lojas, lojaIdStr],
  );

  const produtosDoCatalogo = useMemo(
    () => (lojaIdStr ? produtos.filter((p) => p.loja_id === lojaIdStr) : []),
    [produtos, lojaIdStr],
  );

  useEffect(() => {
    if (!lojaIdStr) {
      setLoja(null);
      setListaProdutos([]);
      return;
    }
    if (catalogLoading) return;

    if (lojaDoCatalogo) {
      setLoja(lojaDoCatalogo);
      setListaProdutos(produtosDoCatalogo);
      return;
    }

    if (fonte !== "supabase") {
      setLoja(null);
      setListaProdutos([]);
      return;
    }

    let cancelled = false;
    setCarregandoExtra(true);
    fetchLojaByIdFromSupabase(lojaIdStr)
      .then((l) => {
        if (cancelled) return;
        if (!l) {
          setLoja(null);
          setListaProdutos([]);
          return;
        }
        setLoja(l);
        return fetchProdutosDaLojaFromSupabase(lojaIdStr).then((ps) => {
          if (!cancelled) setListaProdutos(ps);
        });
      })
      .catch(() => {
        if (!cancelled) {
          setLoja(null);
          setListaProdutos([]);
        }
      })
      .finally(() => {
        if (!cancelled) setCarregandoExtra(false);
      });

    return () => {
      cancelled = true;
    };
  }, [catalogLoading, lojaDoCatalogo, produtosDoCatalogo, fonte, lojaIdStr]);

  const mapsQuery = loja ? queryGoogleMapsLoja(loja) : "";
  const localLabel = loja ? rotuloLocalPublicoLoja(loja) : "";
  const waLink = loja?.whatsapp
    ? whatsappHref(
        loja.whatsapp,
        `Olá! Vi a loja ${loja.nome} no Udiz e gostaria de mais informações.`,
      )
    : "#";

  const mostrandoCarregando = catalogLoading || carregandoExtra;

  return (
    <>
      <Header
        usuario={usuario}
        abrirLogin={() => setAbrirLogin(true)}
        onLogout={() => setUsuario(null)}
      />

      <div className="bg-gray-100 min-h-screen pt-28 pb-24 md:pb-10 px-4 md:px-8">
        <div className="max-w-6xl mx-auto mb-6">
          <Link href="/busca">
            <span className="text-purple-600 font-medium hover:underline text-sm md:text-base cursor-pointer">
              ← Voltar à busca
            </span>
          </Link>
        </div>

        {mostrandoCarregando ? (
          <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-600">Carregando loja...</p>
          </div>
        ) : !loja ? (
          <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-6">
            <h1 className="text-xl font-semibold text-gray-900">Loja não encontrada</h1>
            <p className="text-gray-600 mt-2">
              Essa loja não existe ou não está mais disponível.
            </p>
            <Link
              href="/busca"
              className="inline-block mt-4 text-purple-600 font-medium hover:underline"
            >
              Ir para busca
            </Link>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
              {loja.imagem ? (
                <img
                  src={loja.imagem}
                  alt={loja.nome}
                  className="w-full md:w-48 h-40 object-cover rounded-xl border border-gray-200"
                />
              ) : (
                <div className="w-full md:w-48 h-40 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                  Sem foto
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">{loja.nome}</h1>
                <p className="text-gray-600 mt-1">{localLabel || loja.endereco}</p>
                {loja.whatsapp ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-purple-700 mt-2 text-sm font-medium hover:underline"
                  >
                    WhatsApp: {loja.whatsapp}
                  </a>
                ) : null}
                {loja.descricao ? (
                  <p className="text-sm text-gray-500 mt-2">{loja.descricao}</p>
                ) : null}
                {mapsQuery ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Ver no mapa
                  </a>
                ) : null}
              </div>
            </div>

            <h2 className="font-bold text-gray-900 mb-3">Produtos desta loja</h2>
            {listaProdutos.length === 0 ? (
              <p className="text-gray-600 text-sm">Nenhum produto cadastrado ainda.</p>
            ) : (
              <div className={PRODUCT_CARD_GRID_CLASS}>
                {listaProdutos.map((p) => (
                  <Link
                    key={p.id}
                    href={`/produto/${encodeURIComponent(p.id)}`}
                    className={`${PRODUCT_CARD_SURFACE_INTERACTIVE_CLASS} text-left`}
                    onClick={() => {
                      trackEvent("loja_publica_produto_click", {
                        lojaId: loja.id,
                        produtoId: p.id,
                        userId: usuario?.id ?? "",
                      });
                    }}
                  >
                    <ProductCardImageArea src={p.imagem} alt={p.nome} />
                    <ProductCardNome>{p.nome}</ProductCardNome>
                    <ProductCardPreco valor={Number(p.preco)} />
                    <p className="text-xs text-gray-500">{p.categoria}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />

      <ModalLogin
        aberto={abrirLogin}
        fechar={() => setAbrirLogin(false)}
        onLogin={(user) => setUsuario(user)}
      />
    </>
  );
}
