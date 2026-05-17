"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasAdminGate, setAdminGate } from "@/lib/admin/adminGate";
import { isAdminUser } from "@/lib/authz";
import { signInWithEmailPassword, signOutSupabase } from "@/lib/supabase/authSession";
import { writeUsuario, refreshUsuarioFromSupabaseSession, readUsuario } from "@/lib/usuario";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshUsuarioFromSupabaseSession();
      if (cancelled) return;
      const u = readUsuario();
      if (isAdminUser(u) && hasAdminGate()) {
        router.replace("/admin");
        return;
      }
      setCarregando(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro("");
    if (!email.trim() || !senha) {
      setErro("Informe email e senha.");
      return;
    }
    setEnviando(true);
    const r = await signInWithEmailPassword(email, senha);
    setEnviando(false);
    if (!r.ok) {
      setErro(r.message);
      return;
    }
    if (!isAdminUser(r.user)) {
      await signOutSupabase();
      setErro("Acesso permitido apenas para contas admin ou super_admin.");
      return;
    }
    writeUsuario(r.user);
    setAdminGate();
    window.location.assign("/admin");
  };

  if (carregando) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-50 to-gray-100 px-4 py-12">
        <section className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600 shadow-sm">
          Carregando...
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-gray-100 to-gray-100 px-4 py-12">
      <section className="mx-auto max-w-md overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-xl shadow-purple-900/5">
        <header className="bg-gradient-to-r from-purple-700 via-purple-600 to-violet-600 px-6 py-8 text-center text-white">
          <Link href="/" className="inline-block rounded-xl bg-white/95 p-3 shadow-sm">
            <Image src="/logo.png" alt="Logo Udiz" width={160} height={64} className="h-10 w-auto object-contain" priority />
          </Link>
          <h1 className="mt-4 text-xl font-bold">Acesso administrativo</h1>
          <p className="mt-1 text-sm text-purple-100">Somente contas admin ou super_admin</p>
        </header>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-6">
          {erro ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{erro}</p>
          ) : null}

          <div>
            <label htmlFor="admin-email" className="mb-1 block text-sm font-medium text-gray-800">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none ring-purple-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="admin-senha" className="mb-1 block text-sm font-medium text-gray-800">
              Senha
            </label>
            <input
              id="admin-senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none ring-purple-500 focus:ring-2"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {enviando ? "Entrando..." : "Entrar no painel"}
          </button>

          <p className="text-center text-sm text-gray-600">
            <Link href="/" className="font-medium text-purple-700 hover:underline">
              Voltar ao site
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
