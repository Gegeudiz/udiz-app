"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import ModalLogin from "@/components/ModalLogin";
import { fileToDataUrl, validateImageFile } from "@/lib/files";
import { getSalvosIds } from "@/lib/favoritos";
import { getDataProvider } from "@/lib/repositories/provider";
import { remoteSaveUsuarioPerfil } from "@/lib/supabase/perfilRemote";
import { trackEvent } from "@/lib/telemetry";
import type { Usuario } from "@/lib/types";
import { readUsuario, refreshUsuarioFromSupabaseSession, writeUsuario } from "@/lib/usuario";

export default function PerfilPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loginAberto, setLoginAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [salvosCount, setSalvosCount] = useState(0);
  const [msg, setMsg] = useState<"idle" | "salvo" | "erro">("idle");
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [mostrarBemVindoEmail, setMostrarBemVindoEmail] = useState(false);

  const recarregar = useCallback(() => {
    const u = readUsuario();
    setUsuario(u);
    if (u) {
      setNome(u.nome);
      setBio(u.bio ?? "");
      setFotoFile(null);
      setFotoPreview(u.foto ?? null);
      setSalvosCount(getSalvosIds(u.id).length);
    } else {
      setNome("");
      setBio("");
      setFotoFile(null);
      setFotoPreview(null);
      setSalvosCount(0);
    }
  }, []);

  useEffect(() => {
    void refreshUsuarioFromSupabaseSession().then(() => recarregar());
  }, [recarregar]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("bemvindo") !== "1") return;
    setMostrarBemVindoEmail(true);
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const salvarPerfil = async () => {
    setErroSalvar(null);
    if (!usuario) return;
    const trimmed = nome.trim();
    if (!trimmed) {
      setMsg("erro");
      setTimeout(() => setMsg("idle"), 2500);
      return;
    }
    if (getDataProvider() === "supabase") {
      setSalvando(true);
      const r = await remoteSaveUsuarioPerfil({
        nome: trimmed,
        bio: bio.trim(),
        foto: fotoPreview,
        fotoFile,
      });
      setSalvando(false);
      if (!r.ok) {
        setErroSalvar(r.message);
        return;
      }
      setFotoFile(null);
      setUsuario(r.user);
      setFotoPreview(r.user.foto ?? null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("udiz:usuario-atualizado"));
      }
      trackEvent("perfil_atualizado", { userId: r.user.id });
      setMsg("salvo");
      setTimeout(() => setMsg("idle"), 2200);
      return;
    }
    const atualizado: Usuario = {
      ...usuario,
      nome: trimmed,
      bio: bio.trim(),
      foto: fotoPreview,
    };
    writeUsuario(atualizado);
    setFotoFile(null);
    setUsuario(atualizado);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("udiz:usuario-atualizado"));
    }
    trackEvent("perfil_atualizado", { userId: atualizado.id });
    setMsg("salvo");
    setTimeout(() => setMsg("idle"), 2200);
  };

  const onEscolherFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErroFoto(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    const fileError = validateImageFile(file);
    if (fileError) {
      setErroFoto(fileError);
      return;
    }
    if (!file) return;
    setFotoFile(file);
    void fileToDataUrl(file)
      .then((dataUrl) => setFotoPreview(dataUrl))
      .catch(() => {
        setFotoFile(null);
        setErroFoto("Não foi possível processar a imagem.");
      });
  };

  const removerFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    setErroFoto(null);
  };

  return (
    <div className="min-h-screen w-full bg-white text-gray-900 [color-scheme:light] pb-28 md:pb-10">
      <Header
        usuario={usuario}
        abrirLogin={() => setLoginAberto(true)}
        onLogout={() => {
          setUsuario(null);
          recarregar();
        }}
      />

      <main className="max-w-2xl mx-auto px-4 pt-24 md:pt-28 pb-8">
        {!usuario ? (
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-purple-50 via-white to-orange-50 p-8 md:p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-3xl">
              👤
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Seu espaço no Udiz</h1>
            <p className="mt-2 text-gray-600 text-sm md:text-base max-w-md mx-auto leading-relaxed">
              Entre para editar seu nome, foto e ver um resumo da sua atividade — salvos,
              buscas e acesso ao Udiz Estoque em um só lugar.
            </p>
            <button
              type="button"
              onClick={() => setLoginAberto(true)}
              className="mt-6 rounded-xl bg-purple-600 px-8 py-3 font-semibold text-white shadow-md hover:bg-purple-700 transition-colors"
            >
              Entrar ou criar conta
            </button>
            <p className="mt-6 text-xs text-gray-500">
              Dados ficam neste aparelho até integrarmos com a nuvem.
            </p>
          </div>
        ) : (
          <>
            {mostrarBemVindoEmail ? (
              <div
                role="status"
                className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
              >
                <p className="font-semibold">Obrigado por validar seu email.</p>
                <p className="mt-1 text-emerald-800/90">
                  Sua conta já funcionava antes; este passo só confirma que este endereço é seu.
                </p>
                <button
                  type="button"
                  onClick={() => setMostrarBemVindoEmail(false)}
                  className="mt-2 text-xs font-semibold text-emerald-800 underline"
                >
                  Fechar
                </button>
              </div>
            ) : null}
            <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-orange-500 shadow-md ring-1 ring-black/5">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-64 rounded-full bg-orange-400/20 blur-2xl" />
              <div className="relative px-6 pb-10 pt-8 md:px-8 md:pb-12 md:pt-10">
                <p className="text-sm font-medium text-white/90">Olá de novo</p>
                <h1 className="mt-1 text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {usuario.nome}
                </h1>
                <p className="mt-2 max-w-lg text-sm text-white/85">
                  Personalize como aparece no app e acompanhe o que você curtiu no marketplace.
                </p>
              </div>
            </div>

            <div className="-mt-16 relative z-10 flex flex-col items-center px-2">
              <div className="relative">
                <div className="h-28 w-28 md:h-32 md:w-32 rounded-full border-4 border-white bg-gray-100 shadow-lg overflow-hidden flex items-center justify-center">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl md:text-5xl font-bold text-purple-200">
                      {nome.charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-lg text-white shadow-md ring-4 ring-white hover:bg-orange-600 transition-colors"
                  aria-label="Alterar foto"
                  title="Alterar foto"
                >
                  📷
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onEscolherFoto}
                />
              </div>
              {erroFoto && (
                <p className="mt-3 text-center text-sm text-red-600 max-w-sm">{erroFoto}</p>
              )}
              {fotoPreview && (
                <button
                  type="button"
                  onClick={removerFoto}
                  className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-800 hover:underline"
                >
                  Remover foto
                </button>
              )}
            </div>

            <div className="mt-10 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href="/salvos"
                  className="flex flex-col rounded-xl border border-gray-200 bg-gray-50/80 p-4 hover:border-purple-200 hover:bg-purple-50/50 transition-colors"
                >
                  <span className="text-2xl">❤️</span>
                  <span className="mt-2 font-semibold text-gray-900">Salvos</span>
                  <span className="text-xs text-gray-500 mt-0.5">{salvosCount} produto(s)</span>
                </Link>
                <Link
                  href="/busca"
                  className="flex flex-col rounded-xl border border-gray-200 bg-gray-50/80 p-4 hover:border-purple-200 hover:bg-purple-50/50 transition-colors"
                >
                  <span className="text-2xl">🔍</span>
                  <span className="mt-2 font-semibold text-gray-900">Buscar</span>
                  <span className="text-xs text-gray-500 mt-0.5">Produtos perto de você</span>
                </Link>
                <button
                  type="button"
                  onClick={() => router.push("/estoque/solicitar")}
                  className="flex flex-col text-left rounded-xl border border-gray-200 bg-gray-50/80 p-4 hover:border-orange-200 hover:bg-orange-50/50 transition-colors"
                >
                  <span className="text-2xl">📦</span>
                  <span className="mt-2 font-semibold text-gray-900">Udiz Estoque</span>
                  <span className="text-xs text-gray-500 mt-0.5">Sua loja e produtos</span>
                </button>
              </div>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Dados do perfil</h2>
                <p className="text-sm text-gray-500 mt-1 mb-5">
                  Nome e bio aparecem para você no app; em breve poderão ser públicos com sua escolha.
                  {getDataProvider() === "supabase" ? (
                    <span className="block mt-2 text-gray-600">
                      Com a nuvem ativa, a foto do perfil é enviada ao Supabase Storage e o link fica em{" "}
                      <code className="text-xs bg-gray-100 px-1 rounded">usuarios.foto</code> — não se
                      perde ao trocar de aparelho.
                    </span>
                  ) : null}
                </p>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Nome
                  </span>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    placeholder="Como quer ser chamado(a)?"
                    maxLength={80}
                  />
                </label>
                <label className="block mt-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Bio <span className="font-normal normal-case text-gray-400">(opcional)</span>
                  </span>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={200}
                    className="mt-1.5 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    placeholder="Uma linha sobre você, bairro ou o que costuma comprar..."
                  />
                  <span className="mt-1 block text-right text-xs text-gray-400">
                    {bio.length}/200
                  </span>
                </label>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={() => void salvarPerfil()}
                    className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 shadow-sm transition-colors disabled:opacity-60"
                  >
                    {salvando ? "Salvando..." : "Salvar alterações"}
                  </button>
                  {msg === "salvo" && (
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      ✓ Tudo certo, perfil atualizado.
                    </span>
                  )}
                  {msg === "erro" && (
                    <span className="text-sm font-medium text-red-600">Informe um nome válido.</span>
                  )}
                  {erroSalvar && (
                    <span className="text-sm font-medium text-red-600 sm:max-w-xs">{erroSalvar}</span>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-5 text-center">
                <p className="text-sm text-gray-600">
                  Quer sair desta conta neste aparelho? Use <strong>Sair</strong> no menu do canto
                  superior (avatar).
                </p>
                <Link
                  href="/"
                  className="mt-3 inline-block text-sm font-semibold text-purple-600 hover:underline"
                >
                  ← Voltar ao início
                </Link>
              </section>
            </div>
          </>
        )}
      </main>

      <BottomNav />

      <ModalLogin
        aberto={loginAberto}
        fechar={() => setLoginAberto(false)}
        onLogin={(u) => {
          setUsuario(u);
          setLoginAberto(false);
          recarregar();
        }}
      />
    </div>
  );
}
