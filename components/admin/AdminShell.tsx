"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { encerrarSessaoApp } from "@/lib/auth/logout";
import type { Usuario } from "@/lib/types";

type Props = {
  titulo: string;
  subtitulo?: string;
  usuario: Usuario | null;
  voltarAdmin?: boolean;
  children: ReactNode;
};

export default function AdminShell({
  titulo,
  subtitulo,
  usuario,
  voltarAdmin = false,
  children,
}: Props) {
  const [saindo, setSaindo] = useState(false);
  const roleLabel = usuario?.role ?? "user";

  const handleSair = async () => {
    setSaindo(true);
    await encerrarSessaoApp();
    window.location.href = "/";
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-gray-100 to-gray-100 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-xl shadow-purple-900/5">
        <header className="bg-gradient-to-r from-purple-700 via-purple-600 to-violet-600 px-6 py-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Link href="/" className="shrink-0 rounded-xl bg-white/95 p-2 shadow-sm">
                <Image
                  src="/logo.png"
                  alt="Logo Udiz"
                  width={160}
                  height={64}
                  className="h-10 w-auto object-contain md:h-12"
                  priority
                />
              </Link>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-200">
                  Área administrativa
                </p>
                <h1 className="text-xl font-bold leading-tight md:text-2xl">{titulo}</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleSair()}
              disabled={saindo}
              className="shrink-0 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 disabled:opacity-60"
            >
              {saindo ? "Saindo..." : "Sair"}
            </button>
          </div>
        </header>

        <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
          {voltarAdmin ? (
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center justify-center rounded-lg border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 shadow-sm transition-colors hover:bg-purple-50"
            >
              ← Voltar para o painel Administrativo
            </Link>
          ) : null}
          {subtitulo ? <p className="text-sm text-gray-600">{subtitulo}</p> : null}
          <p className="mt-1 text-sm text-gray-600">
            Logado como <strong className="text-gray-900">{usuario?.nome ?? "Administrador"}</strong>{" "}
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
              {roleLabel}
            </span>
          </p>
        </div>

        <div className="px-6 py-6">{children}</div>
      </div>
    </main>
  );
}
