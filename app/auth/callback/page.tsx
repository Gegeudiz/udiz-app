"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PasswordToggleField from "@/components/PasswordToggleField";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Destino do link "Esqueci a senha" (resetPasswordForEmail).
 * Adicione esta URL em Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarNova, setMostrarNova] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setPronto(true);
    });
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setPronto(true);
    });
    const t = window.setTimeout(() => setPronto((p) => p || true), 1500);
    return () => {
      subscription.unsubscribe();
      window.clearTimeout(t);
    };
  }, []);

  const enviar = async () => {
    setMsg(null);
    if (novaSenha !== confirmar) {
      setMsg("As senhas não coincidem.");
      return;
    }
    if (novaSenha.length < 6) {
      setMsg("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setSalvando(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setSalvando(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    router.replace("/perfil?senha=redefinida");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <h1 className="text-xl font-bold text-gray-900">Nova senha</h1>
        <p className="mt-2 text-sm text-gray-600">
          Defina uma nova senha para sua conta. Depois você pode entrar normalmente com o email e esta
          senha.
        </p>

        {pronto ? (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nova senha
              </span>
              <PasswordToggleField
                showPassword={mostrarNova}
                onToggleShow={() => setMostrarNova((v) => !v)}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                autoComplete="new-password"
                className="mt-1.5"
                placeholder="Mínimo 6 caracteres"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Confirmar nova senha
              </span>
              <PasswordToggleField
                showPassword={mostrarConfirmar}
                onToggleShow={() => setMostrarConfirmar((v) => !v)}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
                className="mt-1.5"
                placeholder="Repita a nova senha"
              />
            </label>
            {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
            <button
              type="button"
              disabled={salvando}
              onClick={() => void enviar()}
              className="w-full rounded-xl bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar nova senha"}
            </button>
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-500">Carregando sessão do link…</p>
        )}

        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-purple-600 hover:underline"
        >
          ← Voltar ao início
        </Link>
      </div>
    </div>
  );
}
