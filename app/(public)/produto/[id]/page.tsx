"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BotaoSalvarProduto from "@/components/BotaoSalvarProduto";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ModalLogin from "@/components/ModalLogin";
import { useCatalog } from "@/contexts/CatalogContext";
import { findLojaById, whatsappHref } from "@/lib/catalogo";
import { fetchLojaByIdFromSupabase, fetchProdutoByIdFromSupabase } from "@/lib/supabase/fetchCatalog";
import type { Loja, Produto, Usuario } from "@/lib/types";
import { trackEvent } from "@/lib/telemetry";
import { readUsuario, refreshUsuarioFromSupabaseSession } from "@/lib/usuario";

export default function ProdutoPage() {
  const params = useParams();
  const idParam = params?.id;
  const produtoId = Array.isArray(idParam) ? idParam[0] : idParam;
  const produtoIdStr = produtoId ? decodeURIComponent(String(produtoId)) : "";

  const { lojas, produtos, loading: catalogLoading, fonte } = useCatalog();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [abrirLogin, setAbrirLogin] = useState(false);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loja, setLoja] = useState<Loja | undefined>(undefined);
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

  useEffect(() => {
    if (!produtoIdStr) {
      setProduto(null);
      return;
    }
    const p = produtos.find((x) => x.id === produtoIdStr) ?? null;
    setProduto(p);
  }, [produtos, produtoIdStr]);

  useEffect(() => {
    if (catalogLoading || fonte !== "supabase" || !produtoIdStr) return;
    const found = produtos.some((x) => x.id === produtoIdStr);
    if (found) return;
    let cancelled = false;
    setCarregandoExtra(true);
    fetchProdutoByIdFromSupabase(produtoIdStr)
      .then((p) => {
        if (!cancelled && p) setProduto(p);
      })
      .finally(() => {
        if (!cancelled) setCarregandoExtra(false);
      });
    return () => {
      cancelled = true;
    };
  }, [catalogLoading, fonte, produtos, produtoIdStr]);

  useEffect(() => {
    if (!produto) {
      setLoja(undefined);
      return;
    }
    const l = findLojaById(lojas, produto.loja_id);
    if (l) {
      setLoja(l);
      return;
    }
    if (fonte !== "supabase") return;
    let cancelled = false;
    fetchLojaByIdFromSupabase(produto.loja_id).then((remote) => {
      if (!cancelled && remote) setLoja(remote);
    });
    return () => {
      cancelled = true;
    };
  }, [produto, lojas, fonte]);

  const waLink = useMemo(() => {
    if (!loja?.whatsapp || !produto) return "#";
    const msg = `Olá! Vi no Udiz o produto "${produto.nome}" na loja ${loja.nome}.`;
    return whatsappHref(loja.whatsapp, msg);
  }, [loja, produto]);

  const imagemUrl = produto
    ? produto.imagem || loja?.imagem || "https://picsum.photos/600/400"
    : "https://picsum.photos/600/400";

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
            <p className="text-gray-600">Carregando produto...</p>
          </div>
        ) : !produto ? (
          <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-6">
            <h1 className="text-xl font-semibold text-gray-900">Produto não encontrado</h1>
            <p className="text-gray-600 mt-2">
              Esse item não existe ou foi removido. Tente outra busca.
            </p>
            <Link
              href="/busca"
              className="inline-block mt-4 text-purple-600 font-medium hover:underline"
            >
              Ir para busca
            </Link>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-4 md:p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl flex items-center justify-center p-4">
                <img
                  src={imagemUrl}
                  alt={produto.nome}
                  className="max-h-[400px] w-full object-contain rounded-lg"
                />
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <p className="text-xs text-gray-500">{produto.categoria}</p>
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-900 flex-1 min-w-0">
                      {produto.nome}
                    </h1>
                    <BotaoSalvarProduto
                      produtoId={produto.id}
                      usuario={usuario}
                      onPrecisaLogin={() => setAbrirLogin(true)}
                      className="shrink-0"
                    />
                  </div>

                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    R$ {Number(produto.preco).toFixed(2)}
                  </p>

                  <p className="text-gray-500 mt-1">
                    Vendido por: {loja?.nome ?? "Loja"}
                  </p>

                  {loja?.endereco && (
                    <p className="text-sm text-gray-400 mt-1">📍 {loja.endereco}</p>
                  )}

                  {produto.descricao ? (
                    <p className="text-gray-600 mt-4 text-sm">{produto.descricao}</p>
                  ) : null}

                  {loja?.descricao && (
                    <p className="text-gray-500 mt-3 text-xs border-t pt-3">{loja.descricao}</p>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (usuario && produto) {
                        trackEvent("produto_whatsapp_click", {
                          userId: usuario.id,
                          produtoId: produto.id,
                          lojaId: loja?.id ?? "",
                        });
                      }
                    }}
                    className="bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 text-center"
                  >
                    Falar no WhatsApp
                  </a>

                  {loja?.endereco && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loja.endereco)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 text-center"
                    >
                      Ver no mapa
                    </a>
                  )}
                </div>
              </div>
            </div>
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
