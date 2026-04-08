"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PasswordToggleField from "@/components/PasswordToggleField";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Destino do link "Esqueci a senha" (resetPasswordForEmail).
 * Supabase → Authentication → URL Configuration → Redirect URLs:
 *   https://SEU_DOMINIO/auth/callback
 *   http://localhost:3000/auth/callback
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<"carregando" | "pronto" | "erro">("carregando");
  const [erroSessao, setErroSessao] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarNova, setMostrarNova] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let unsubscribe: (() => void) | undefined;
    let timeoutId: number | undefined;

    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelado) return;
          if (error) {
            setErroSessao(error.message);
            setEstado("erro");
            return;
          }
          window.history.replaceState({}, "", url.pathname);
          setEstado("pronto");
          return;
        }

        const hash = window.location.hash?.replace(/^#/, "") ?? "";
        if (hash) {
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (cancelado) return;
            if (error) {
              setErroSessao(error.message);
              setEstado("erro");
              return;
            }
            window.history.replaceState({}, "", url.pathname + url.search);
            setEstado("pronto");
            return;
          }
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (cancelado) return;
          if (
            event === "PASSWORD_RECOVERY" ||
            (event === "SIGNED_IN" && session)
          ) {
            setEstado("pronto");
          }
        });
        unsubscribe = () => subscription.unsubscribe();

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelado) return;
        if (session) {
          setEstado("pronto");
          return;
        }

        timeoutId = window.setTimeout(() => {
          void supabase.auth.getSession().then(({ data: { session: s2 } }) => {
            if (cancelado) return;
            if (s2) {
              setEstado("pronto");
              return;
            }
            setErroSessao(
              "Não foi possível validar o link (expirado, já usado ou URL incorreta). Peça um novo email em Esqueci a senha. No painel do Supabase, confira Site URL e Redirect URLs (incluindo https://seu-dominio/auth/callback).",
            );
            setEstado("erro");
          });
        }, 3000);
      } catch (e) {
        if (cancelado) return;
        setErroSessao(e instanceof Error ? e.message : "Erro ao processar o link.");
        setEstado("erro");
      }
    })();

    return () => {
      cancelado = true;
      unsubscribe?.();
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
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
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Udiz</p>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Redefinir senha</h1>
        <p className="mt-2 text-sm text-gray-600">
          Defina uma nova senha para sua conta Udiz. Depois você pode entrar com o email e esta senha.
        </p>

        {estado === "carregando" ? (
          <p className="mt-6 text-sm text-gray-500">Validando o link enviado por email…</p>
        ) : estado === "erro" ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-medium">Não deu certo abrir o link</p>
            <p className="mt-2 text-amber-900/90">{erroSessao}</p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-semibold text-purple-700 hover:underline"
            >
              Voltar ao início e pedir novo link
            </Link>
          </div>
        ) : (
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
