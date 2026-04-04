"use client";

import { useState } from "react";
import type { Usuario } from "@/lib/types";
import { getDataProvider } from "@/lib/repositories/provider";
import { requestBoasVindasEmail } from "@/lib/emails/requestBoasVindas";
import { signInWithEmailPassword, signUpWithEmailPassword } from "@/lib/supabase/authSession";
import { trackEvent } from "@/lib/telemetry";
import { writeUsuario } from "@/lib/usuario";

type Props = {
  aberto: boolean;
  fechar: () => void;
  onLogin: (user: Usuario) => void;
};

export default function ModalLogin({ aberto, fechar, onLogin }: Props) {
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [nome, setNome] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [cadastroEmail, setCadastroEmail] = useState("");
  const [cadastroSenha, setCadastroSenha] = useState("");
  const [cadastroTel, setCadastroTel] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erroForm, setErroForm] = useState("");
  /** Cadastro ok, mas sessão só após confirmar email no Supabase. */
  const [emailAguardandoConfirmacao, setEmailAguardandoConfirmacao] = useState<string | null>(null);

  const usarSupabase = getDataProvider() === "supabase";

  const resetCampos = () => {
    setNome("");
    setLoginEmail("");
    setLoginSenha("");
    setCadastroEmail("");
    setCadastroSenha("");
    setCadastroTel("");
    setErroForm("");
    setCarregando(false);
    setEmailAguardandoConfirmacao(null);
  };

  const handleLogin = (user: Usuario) => {
    writeUsuario(user);
    trackEvent("auth_login_success", { userId: user.id });
    onLogin(user);
  };

  const submitLoginSupabase = async () => {
    setErroForm("");
    if (!loginEmail.trim() || !loginSenha) {
      setErroForm("Informe email e senha.");
      return;
    }
    setCarregando(true);
    const r = await signInWithEmailPassword(loginEmail, loginSenha);
    setCarregando(false);
    if (!r.ok) {
      setErroForm(r.message);
      return;
    }
    handleLogin(r.user);
    resetCampos();
    fechar();
  };

  const submitCadastroSupabase = async () => {
    setErroForm("");
    if (!cadastroEmail.trim() || !cadastroSenha) {
      setErroForm("Informe email e senha.");
      return;
    }
    setCarregando(true);
    const r = await signUpWithEmailPassword(cadastroEmail, cadastroSenha, nome.trim() || "Usuário");
    setCarregando(false);
    if (r.ok === false) {
      setErroForm(r.message);
      return;
    }
    if (r.ok === "confirm_email") {
      setErroForm("");
      setEmailAguardandoConfirmacao(cadastroEmail.trim());
      return;
    }
    requestBoasVindasEmail(r.accessToken);
    handleLogin(r.user);
    resetCampos();
    fechar();
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-200">

        <h2 className="text-2xl font-bold mb-1 text-center text-gray-900">
          {modo === "login" ? "Entrar na sua conta" : "Criar sua conta"}
        </h2>
        <p className="text-sm text-gray-600 text-center mb-5">
          {usarSupabase
            ? modo === "login"
              ? "Use o mesmo email e senha cadastrados no Supabase (Auth)."
              : "Preencha os dados. Se o projeto exigir confirmação por email, você receberá um link para ativar a conta."
            : modo === "login"
              ? "Acesse para continuar no Udiz."
              : "Preencha os dados para criar seu acesso."}
        </p>

        {erroForm && (
          <p className="mb-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3">
            {erroForm}
          </p>
        )}

        {usarSupabase && modo === "cadastro" && emailAguardandoConfirmacao ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            <p className="font-semibold text-base text-emerald-900">
              Confirme sua conta para autenticar o seu cadastro.
            </p>
            <p className="mt-2 text-emerald-900/90">
              O Supabase ainda exige confirmação por email. Abra a mensagem enviada para{" "}
              <span className="font-medium break-all">{emailAguardandoConfirmacao}</span> e use o
              link; depois <strong>Entrar</strong> com a mesma senha.
            </p>
            <p className="mt-2 text-xs text-emerald-800/80">
              Para cadastro imediato (sem esperar email), no painel do Supabase desligue{" "}
              <strong>Confirm email</strong> em Authentication → Providers → Email. O Udiz envia
              boas-vindas pelo Resend; isso é independente da confirmação do Supabase.
            </p>
            <button
              type="button"
              onClick={() => {
                setLoginEmail(emailAguardandoConfirmacao);
                setEmailAguardandoConfirmacao(null);
                setCadastroEmail("");
                setCadastroSenha("");
                setNome("");
                setCadastroTel("");
                setModo("login");
              }}
              className="mt-4 w-full rounded-md bg-purple-600 py-2.5 font-semibold text-white hover:bg-purple-700"
            >
              Ir para Entrar
            </button>
          </div>
        ) : null}

        {modo === "login" ? (
          <>
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              autoComplete="email"
              className="w-full border border-gray-300 text-gray-900 placeholder:text-gray-500 p-3 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />

            <input
              type="password"
              placeholder="Senha"
              value={loginSenha}
              onChange={(e) => setLoginSenha(e.target.value)}
              autoComplete="current-password"
              className="w-full border border-gray-300 text-gray-900 placeholder:text-gray-500 p-3 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />

            {usarSupabase ? (
              <button
                type="button"
                disabled={carregando}
                onClick={() => void submitLoginSupabase()}
                className="w-full bg-purple-600 text-white font-semibold py-2.5 rounded-md mb-2 hover:bg-purple-700 transition-colors disabled:opacity-60"
              >
                {carregando ? "Entrando..." : "Entrar"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  handleLogin({ id: "udiz-user-demo", nome: "Usuário Teste" });
                  resetCampos();
                  fechar();
                }}
                aria-label="Entrar na conta de demonstração"
                className="w-full bg-purple-600 text-white font-semibold py-2.5 rounded-md mb-2 hover:bg-purple-700 transition-colors"
              >
                Entrar (demonstração — dados só neste aparelho)
              </button>
            )}
          </>
        ) : (
          <>
            {!(usarSupabase && emailAguardandoConfirmacao) ? (
              <>
                <input
                  type="text"
                  placeholder="Nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="name"
                  className="w-full border border-gray-300 text-gray-900 placeholder:text-gray-500 p-3 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={cadastroEmail}
                  onChange={(e) => setCadastroEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full border border-gray-300 text-gray-900 placeholder:text-gray-500 p-3 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />

                <input
                  type="tel"
                  placeholder="Telefone"
                  value={cadastroTel}
                  onChange={(e) => setCadastroTel(e.target.value)}
                  autoComplete="tel"
                  className="w-full border border-gray-300 text-gray-900 placeholder:text-gray-500 p-3 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />

                <input
                  type="password"
                  placeholder="Senha"
                  value={cadastroSenha}
                  onChange={(e) => setCadastroSenha(e.target.value)}
                  autoComplete="new-password"
                  className="w-full border border-gray-300 text-gray-900 placeholder:text-gray-500 p-3 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />

                {usarSupabase ? (
                  <button
                    type="button"
                    disabled={carregando}
                    onClick={() => void submitCadastroSupabase()}
                    className="w-full bg-purple-600 text-white font-semibold py-2.5 rounded-md mb-2 hover:bg-purple-700 transition-colors disabled:opacity-60"
                  >
                    {carregando ? "Criando..." : "Criar conta"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleLogin({
                        id: `udiz-u-${Date.now()}`,
                        nome: nome.trim() || "Usuário Teste",
                      });
                      resetCampos();
                      fechar();
                    }}
                    className="w-full bg-purple-600 text-white font-semibold py-2.5 rounded-md mb-2 hover:bg-purple-700 transition-colors"
                  >
                    Criar conta (local)
                  </button>
                )}
              </>
            ) : null}
          </>
        )}

        {modo === "login" ? (
          <p className="text-sm text-center mt-4 text-gray-600">
            Não tem conta?{" "}
            <button
              type="button"
              onClick={() => {
                setModo("cadastro");
                setErroForm("");
              }}
              className="text-purple-700 font-semibold hover:underline"
            >
              Criar conta
            </button>
          </p>
        ) : (
          <p className="text-sm text-center mt-4 text-gray-600">
            Já tem conta?{" "}
            <button
              type="button"
              onClick={() => {
                if (emailAguardandoConfirmacao) {
                  setLoginEmail(emailAguardandoConfirmacao);
                }
                setEmailAguardandoConfirmacao(null);
                setModo("login");
                setErroForm("");
              }}
              className="text-purple-700 font-semibold hover:underline"
            >
              Entrar
            </button>
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setModo("login");
            resetCampos();
            fechar();
          }}
          className="w-full text-gray-600 text-sm mt-2 hover:text-gray-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
