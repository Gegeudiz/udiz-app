"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ModalLogin from "@/components/ModalLogin";
import { getDataProvider } from "@/lib/repositories/provider";
import type { Usuario } from "@/lib/types";
import { readUsuario, refreshUsuarioFromSupabaseSession, writeUsuario } from "@/lib/usuario";

export default function EstoqueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [abrirLogin, setAbrirLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshUsuarioFromSupabaseSession();
      if (cancelled) return;
      setUsuario(readUsuario());
      setAuthReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    const onPerfilSalvo = () => {
      void refreshUsuarioFromSupabaseSession().then(() => setUsuario(readUsuario()));
    };
    window.addEventListener("udiz:usuario-atualizado", onPerfilSalvo);
    return () => window.removeEventListener("udiz:usuario-atualizado", onPerfilSalvo);
  }, [authReady]);

  useEffect(() => {
    if (!authReady || !usuario) return;
    const onFocus = () => {
      void refreshUsuarioFromSupabaseSession().then(() => setUsuario(readUsuario()));
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [authReady, usuario]);

  useEffect(() => {
    if (!authReady) return;
    if (!usuario) router.replace("/?estoque=1");
  }, [authReady, usuario, router]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-600">
        Carregando...
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-600">
        Redirecionando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <Header
        usuario={usuario}
        abrirLogin={() => setAbrirLogin(true)}
        onLogout={() => {
          setUsuario(null);
          router.replace("/");
        }}
      />

      <main className="pt-20 md:pt-24 px-4 md:px-8 pb-10">
        {getDataProvider() === "local" && process.env.NEXT_PUBLIC_SUPABASE_URL ? (
          <div
            role="status"
            className="mb-4 rounded-xl border border-amber-400/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
          >
            <strong className="font-semibold">Modo local ativo:</strong> lojas e produtos ficam só no
            navegador — nada é gravado no Supabase. Para usar a nuvem, em{" "}
            <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">.env.local</code> defina{" "}
            <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">
              NEXT_PUBLIC_DATA_PROVIDER=supabase
            </code>{" "}
            e reinicie o servidor (<code className="text-xs">npm run dev</code>). Depois entre com email
            e senha do Supabase Auth.
          </div>
        ) : null}
        {children}
      </main>

      <ModalLogin
        aberto={abrirLogin}
        fechar={() => setAbrirLogin(false)}
        onLogin={(user) => {
          writeUsuario(user);
          setUsuario(user);
        }}
      />
    </div>
  );
}
