"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ModalLogin from "@/components/ModalLogin";
import {
  PRODUCT_CARD_GRID_CLASS,
  PRODUCT_CARD_SURFACE_INTERACTIVE_CLASS,
  ProductCardImageArea,
  ProductCardNome,
  ProductCardPreco,
} from "@/components/ProductCardLayout";
import { useCatalog } from "@/contexts/CatalogContext";
import { getSalvosIds } from "@/lib/favoritos";
import { readUsuario, refreshUsuarioFromSupabaseSession } from "@/lib/usuario";
import type { Usuario } from "@/lib/types";

export default function SalvosPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loginAberto, setLoginAberto] = useState(false);
  const [loading, setLoading] = useState(true);
  const { produtos: todos } = useCatalog();

  useEffect(() => {
    void refreshUsuarioFromSupabaseSession().then(() => {
      setUsuario(readUsuario());
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const onPerfil = () => {
      void refreshUsuarioFromSupabaseSession().then(() => setUsuario(readUsuario()));
    };
    window.addEventListener("udiz:usuario-atualizado", onPerfil);
    return () => window.removeEventListener("udiz:usuario-atualizado", onPerfil);
  }, []);

  const idsSalvos = usuario ? getSalvosIds(usuario.id) : [];
  const lista = useMemo(
    () => todos.filter((p) => idsSalvos.includes(p.id)),
    [todos, idsSalvos]
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <Header
        abrirLogin={() => setLoginAberto(true)}
        usuario={usuario}
        onLogout={() => setUsuario(null)}
      />
      <main className="max-w-6xl mx-auto px-4 pt-24 md:pt-28 pb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Salvos</h1>
        <p className="text-gray-600 text-sm mb-6">
          Produtos que você marcou com o coração.
        </p>

        {loading && <p className="text-gray-600">Carregando...</p>}

        {!loading && !usuario && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            <p className="mb-4">Entre na sua conta para ver e gerenciar seus produtos salvos.</p>
            <button
              type="button"
              onClick={() => setLoginAberto(true)}
              className="rounded-lg bg-orange-500 text-white px-5 py-2.5 font-medium hover:bg-orange-600"
            >
              Entrar
            </button>
          </div>
        )}

        {!loading && usuario && lista.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            <p className="mb-4">Você ainda não salvou nenhum produto.</p>
            <Link
              href="/busca"
              className="inline-block rounded-lg bg-orange-500 text-white px-5 py-2.5 font-medium hover:bg-orange-600"
            >
              Explorar produtos
            </Link>
          </div>
        )}

        {!loading && usuario && lista.length > 0 && (
          <div className={PRODUCT_CARD_GRID_CLASS}>
            {lista.map((p) => (
              <Link
                key={p.id}
                href={`/produto/${encodeURIComponent(p.id)}`}
                className={PRODUCT_CARD_SURFACE_INTERACTIVE_CLASS}
              >
                <ProductCardImageArea src={p.imagem} alt={p.nome} />
                <ProductCardNome>{p.nome}</ProductCardNome>
                <ProductCardPreco valor={Number(p.preco)} />
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      <ModalLogin
        aberto={loginAberto}
        fechar={() => setLoginAberto(false)}
        onLogin={(u) => {
          setUsuario(u);
          setLoginAberto(false);
        }}
      />
    </div>
  );
}
