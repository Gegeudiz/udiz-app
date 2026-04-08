"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CIDADES_DISPONIVEIS, readCidadeSelecionada, writeCidadeSelecionada } from "@/lib/cidades";
import BannerPromocional from "./BannerPromocional";

export default function Hero() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [cidade, setCidade] = useState("");
  useEffect(() => {
    setCidade(readCidadeSelecionada());
  }, []);

  const categorias = [
    { nome: "Brinquedos", emoji: "🧸" },
    { nome: "Cosméticos", emoji: "💄" },
    { nome: "Escritório", emoji: "📎" },
    { nome: "Escola", emoji: "📚" },
    { nome: "Casa/Jardim", emoji: "🏡" },
    { nome: "Decoração", emoji: "🖼️" },
    { nome: "Festas", emoji: "🎉" },
    { nome: "Pet", emoji: "🐶" },
    { nome: "Ferragista", emoji: "🛠️" },
    { nome: "Eletrônicos", emoji: "📱" },
    { nome: "Outros", emoji: "📦" },
  ];

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

      {/* CATEGORIAS */}
      <div className="max-w-6xl mx-auto mt-10 px-4 md:px-0">

      <div
  ref={scrollRef}
  className="
    flex gap-6
    overflow-x-auto md:overflow-visible
    no-scrollbar
    flex-nowrap md:flex-wrap
    justify-start md:justify-center
    md:px-0
  "
>
          {categorias.map((cat) => (
            <button
              type="button"
              key={cat.nome}
              onClick={() => {
                const params = new URLSearchParams();
                params.set("categoria", cat.nome);
                if (cidade) params.set("cidade", cidade);
                writeCidadeSelecionada(cidade);
                router.push(`/busca?${params.toString()}`);
              }}
              className="flex flex-col items-center min-w-[80px] cursor-pointer bg-transparent border-0 p-0"
            >
              {/* BOLINHA */}
              <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center text-2xl shadow-md hover:scale-105 transition">
                {cat.emoji}
              </div>

              {/* NOME */}
              <span className="mt-2 text-sm text-white text-center">
                {cat.nome}
              </span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}