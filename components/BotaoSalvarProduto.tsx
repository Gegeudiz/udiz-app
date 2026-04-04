"use client";

import { useEffect, useState } from "react";
import type { Usuario } from "@/lib/types";
import { isProdutoSalvo, toggleProdutoSalvo } from "@/lib/favoritos";
import { trackEvent } from "@/lib/telemetry";

type Props = {
  produtoId: string;
  usuario: Usuario | null;
  onPrecisaLogin: () => void;
  className?: string;
};

export default function BotaoSalvarProduto({
  produtoId,
  usuario,
  onPrecisaLogin,
  className = "",
}: Props) {
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (!usuario) {
      setSalvo(false);
      return;
    }
    setSalvo(isProdutoSalvo(usuario.id, produtoId));
  }, [usuario, produtoId]);

  const clicar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!usuario) {
      onPrecisaLogin();
      return;
    }
    const ficouSalvo = toggleProdutoSalvo(usuario.id, produtoId);
    setSalvo(ficouSalvo);
    trackEvent("produto_salvo_toggle", {
      userId: usuario.id,
      produtoId,
      saved: ficouSalvo,
    });
  };

  return (
    <button
      type="button"
      onClick={clicar}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/95 shadow-md border border-gray-200 text-lg leading-none hover:bg-white hover:scale-105 transition-transform ${className}`}
      aria-label={salvo ? "Remover dos salvos" : "Salvar produto"}
      title={salvo ? "Remover dos salvos" : "Salvar nos Salvos"}
    >
      <span
        className={salvo ? "text-red-500 text-xl leading-none" : "text-gray-400 text-xl leading-none"}
        aria-hidden
      >
        {salvo ? "♥" : "♡"}
      </span>
    </button>
  );
}
