"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CIDADES_DISPONIVEIS, readCidadeSelecionada, writeCidadeSelecionada } from "@/lib/cidades";
import { CATEGORIAS_UDIZ } from "@/lib/categoriasUdiz";
import BannerPromocional from "./BannerPromocional";

export default function Hero() {
  const router = useRouter();
  const [buscaProduto, setBuscaProduto] = useState("");
  const [cidade, setCidade] = useState("");
  const [menuCategoriasAberto, setMenuCategoriasAberto] = useState(false);
  const categoriasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCidade(readCidadeSelecionada());
  }, []);

  useEffect(() => {
    if (!menuCategoriasAberto) return;
    const fechar = (e: MouseEvent) => {
      if (categoriasRef.current?.contains(e.target as Node)) return;
      setMenuCategoriasAberto(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuCategoriasAberto(false);
    };
    document.addEventListener("mousedown", fechar);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", fechar);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuCategoriasAberto]);

  const irParaCategoria = (nome: string) => {
    setMenuCategoriasAberto(false);
    const params = new URLSearchParams();
    params.set("categoria", nome);
    if (cidade) params.set("cidade", cidade);
    writeCidadeSelecionada(cidade);
    router.push(`/busca?${params.toString()}`);
  };

  return (
    <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white pb-12">
      <BannerPromocional />

      {/* TEXTO + BUSCA */}
      <div className="max-w-4xl mx-auto text-center px-4 pt-8 md:pt-10">
        <h1 className="text-2xl md:text-4xl font-bold">
          Encontre produtos{" "}
          <span className="text-orange-400">perto de você!</span>
        </h1>

        <p className="mt-2 text-sm md:text-base">
          Fácil e rápido. O que você precisa está logo ali!
        </p>

        <div className="mt-6 flex flex-col md:flex-row gap-3 justify-center">
          <select
            value={cidade}
            onChange={(e) => {
              setCidade(e.target.value);
              writeCidadeSelecionada(e.target.value);
            }}
            className="px-4 py-2 rounded-lg text-black bg-white w-full md:w-auto"
            aria-label="Selecionar cidade"
          >
            <option value="">Selecione sua cidade...</option>
            {CIDADES_DISPONIVEIS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="O que você procura hoje?"
            value={buscaProduto}
            onChange={(e) => setBuscaProduto(e.target.value)}
            className="px-4 py-2 rounded-lg text-black bg-white w-full md:w-auto"
          />

          <button
            type="button"
            onClick={() => {
              const q = buscaProduto.trim();
              const params = new URLSearchParams();
              if (q) params.set("q", q);
              if (cidade) params.set("cidade", cidade);
              writeCidadeSelecionada(cidade);
              const qs = params.toString();
              router.push(qs ? `/busca?${qs}` : "/busca");
            }}
            className="bg-orange-500 px-6 py-2 rounded-lg font-semibold"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* CATEGORIAS — menu suspenso */}
      <div className="max-w-6xl mx-auto mt-10 px-4 md:px-0 flex justify-center">
        <div ref={categoriasRef} className="relative inline-block text-left">
          <button
            type="button"
            onClick={() => setMenuCategoriasAberto((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-expanded={menuCategoriasAberto}
            aria-haspopup="menu"
            aria-controls="menu-categorias-udiz"
          >
            Categorias
            <span
              className={`inline-block transition-transform ${menuCategoriasAberto ? "rotate-180" : ""}`}
              aria-hidden
            >
              ▼
            </span>
          </button>

          {menuCategoriasAberto ? (
            <ul
              id="menu-categorias-udiz"
              role="menu"
              className="absolute left-1/2 z-20 mt-2 w-[min(100vw-2rem,22rem)] -translate-x-1/2 rounded-xl border border-white/20 bg-white py-2 text-gray-900 shadow-xl max-h-[min(70vh,24rem)] overflow-y-auto"
            >
              {CATEGORIAS_UDIZ.map((cat) => (
                <li key={cat} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 focus:bg-purple-50 focus:outline-none"
                    onClick={() => irParaCategoria(cat)}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
