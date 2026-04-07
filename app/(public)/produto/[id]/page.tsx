"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BotaoSalvarProduto from "@/components/BotaoSalvarProduto";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ModalLogin from "@/components/ModalLogin";
import { useCatalog } from "@/contexts/CatalogContext";
import { usePublicAppBaseUrl } from "@/hooks/usePublicAppBaseUrl";
import { buildProdutoPageAbsoluteUrl } from "@/lib/appUrl";
import { findLojaById, whatsappHref } from "@/lib/catalogo";
import { queryGoogleMapsLoja, rotuloLocalPublicoLoja } from "@/lib/enderecoLoja";
import { fetchLojaByIdFromSupabase, fetchProdutoByIdFromSupabase } from "@/lib/supabase/fetchCatalog";
import type { Loja, Produto, Usuario } from "@/lib/types";
import { trackEvent } from "@/lib/telemetry";
import { produtoAtualizadoNosUltimosDias } from "@/lib/produtoAtualizadoRecente";
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
  const [shareFeedback, setShareFeedback] = useState<"" | "copied">("");
  const linkBase = usePublicAppBaseUrl();

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

  const produtoPaginaUrl =
    produto && linkBase ? buildProdutoPageAbsoluteUrl(linkBase, produto.id) : "";

  const waLink = useMemo(() => {
    if (!loja?.whatsapp || !produto) return "#";
    const lines = [
      "Olá, vi este produto no Udiz e gostaria de maiores informações.",
      "",
      `Produto: ${produto.nome}`,
      `Loja: ${loja.nome}`,
    ];
    if (produtoPaginaUrl) {
      lines.push("", `Link: ${produtoPaginaUrl}`);
    }
    return whatsappHref(loja.whatsapp, lines.join("\n"));
  }, [loja, produto, produtoPaginaUrl]);

  const compartilharProduto = async () => {
    if (!produto || !produtoPaginaUrl) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `${produto.nome} no Udiz`,
          text: `Confira este produto no Udiz: ${produto.nome}`,
          url: produtoPaginaUrl,
        });
        trackEvent("produto_compartilhado", {
          metodo: "native_share",
          produtoId: produto.id,
          lojaId: loja?.id ?? "",
          userId: usuario?.id ?? "",
        });
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(produtoPaginaUrl);
      setShareFeedback("copied");
      window.setTimeout(() => setShareFeedback(""), 2200);
      trackEvent("produto_compartilhado", {
        metodo: "clipboard",
        produtoId: produto.id,
        lojaId: loja?.id ?? "",
        userId: usuario?.id ?? "",
      });
    } catch {
      window.prompt("Copie o link do produto:", produtoPaginaUrl);
    }
  };

  const localizacaoPublica = loja ? rotuloLocalPublicoLoja(loja) : "";
  const mapsQuery = loja ? queryGoogleMapsLoja(loja) : "";
  const mostrarSeloAtualizado = produto ? produtoAtualizadoNosUltimosDias(produto, 15) : false;

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
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void compartilharProduto()}
                        disabled={!produtoPaginaUrl}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/95 shadow-md border border-gray-200 text-purple-600 hover:bg-white hover:scale-105 transition-transform disabled:opacity-40 disabled:pointer-events-none disabled:hover:scale-100"
                        aria-label="Compartilhar link do produto"
                        title={
                          shareFeedback === "copied"
                            ? "Link copiado!"
                            : produtoPaginaUrl
                              ? "Compartilhar ou copiar link"
                              : "Gerando link…"
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-[1.125rem] h-[1.125rem]"
                          aria-hidden
                        >
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" x2="12" y1="2" y2="15" />
                        </svg>
                      </button>
                      <BotaoSalvarProduto
                        produtoId={produto.id}
                        usuario={usuario}
                        onPrecisaLogin={() => setAbrirLogin(true)}
                        className="shrink-0"
                      />
                    </div>
                  </div>

                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    R$ {Number(produto.preco).toFixed(2)}
                  </p>

                  {mostrarSeloAtualizado ? (
                    <p className="mt-2 text-xs font-medium text-emerald-800 border-l-4 border-emerald-500 bg-emerald-50 pl-2 py-1 pr-2 rounded-r-md max-w-xl">
                      Atualizado recentemente
                    </p>
                  ) : null}

                  <p className="text-gray-500 mt-1">
                    Vendido por:{" "}
                    {loja ? (
                      <Link
                        href={`/loja/${encodeURIComponent(loja.id)}`}
                        className="font-medium text-purple-600 hover:text-purple-800 hover:underline"
                        onClick={() => {
                          if (usuario && produto) {
                            trackEvent("produto_ver_loja_click", {
                              userId: usuario.id,
                              produtoId: produto.id,
                              lojaId: loja.id,
                            });
                          }
                        }}
                      >
                        {loja.nome}
                      </Link>
                    ) : (
                      "Loja"
                    )}
                  </p>

                  {localizacaoPublica ? (
                    <p className="text-sm text-gray-400 mt-1">📍 {localizacaoPublica}</p>
                  ) : null}

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
                    Falar com a Loja
                  </a>

                  {mapsQuery ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 text-center"
                    >
                      Ir até à loja
                    </a>
                  ) : null}
                </div>

                <p className="text-sm text-gray-400 mt-4 leading-relaxed" role="note">
                  O preço neste Produto é o preço de referência atualizado pelo próprio Lojista e pode variar para mais ou para menos. Clique em Falar
                  com a Loja para confirmar o valor atual e mais informações sobre o produto.
                </p>
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
