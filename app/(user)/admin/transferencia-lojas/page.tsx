"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminUser } from "@/lib/authz";
import { encerrarSessaoApp } from "@/lib/auth/logout";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { refreshUsuarioFromSupabaseSession } from "@/lib/usuario";
import type { Usuario } from "@/lib/types";
import { readUsuario } from "@/lib/usuario";

type ResultadoTransferencia = {
  lojaId: string;
  novoOwnerId: string;
  motivo: string;
};

export default function TransferenciaLojasAdminPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [lojaId, setLojaId] = useState("");
  const [novoOwnerId, setNovoOwnerId] = useState("");
  const [motivo, setMotivo] = useState("Transferência administrativa após validação de pedido");
  const [enviando, setEnviando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<ResultadoTransferencia | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshUsuarioFromSupabaseSession();
      if (cancelled) return;
      const current = readUsuario();
      setUsuario(current);
      setLoadingAuth(false);
      if (!isAdminUser(current)) {
        router.replace("/");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const roleLabel = useMemo(() => {
    if (!usuario?.role) return "user";
    return usuario.role;
  }, [usuario?.role]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro("");
    setResultado(null);

    const lojaIdTrim = lojaId.trim();
    const novoOwnerIdTrim = novoOwnerId.trim();
    const motivoTrim = motivo.trim();
    if (!lojaIdTrim || !novoOwnerIdTrim) {
      setErro("Informe o ID da loja e o ID do novo dono.");
      return;
    }

    if (!usuario?.id) {
      setErro("Sessão inválida. Faça login novamente.");
      return;
    }

    setEnviando(true);
    const supabase = createSupabaseBrowserClient();
    const tentativas = [
      {
        fn: () =>
          supabase.rpc("transferir_loja_admin", {
            p_loja_id: lojaIdTrim,
            p_novo_owner_id: novoOwnerIdTrim,
            p_motivo: motivoTrim || null,
          }),
      },
      {
        fn: () =>
          supabase.rpc("transferir_loja_admin", {
            p_loja_id: lojaIdTrim,
            p_novo_owner_id: novoOwnerIdTrim,
            p_motivo: motivoTrim || null,
            p_actor_id: usuario.id,
          }),
      },
    ] as const;

    let lastError: string | null = null;
    for (const tentativa of tentativas) {
      const { error } = await tentativa.fn();
      if (!error) {
        setResultado({
          lojaId: lojaIdTrim,
          novoOwnerId: novoOwnerIdTrim,
          motivo: motivoTrim,
        });
        setEnviando(false);
        return;
      }
      lastError = error.message;
    }

    setErro(lastError ?? "Não foi possível transferir a loja.");
    setEnviando(false);
  };

  const handleSair = async () => {
    setSaindo(true);
    await encerrarSessaoApp();
    router.replace("/");
  };

  if (loadingAuth) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-10 text-gray-700">
        <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6">
          Verificando acesso administrativo...
        </div>
      </main>
    );
  }

  if (!isAdminUser(usuario)) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10 text-black">
      <section className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin - Transferência de loja</h1>
          <button
            type="button"
            onClick={() => void handleSair()}
            disabled={saindo}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-60"
          >
            {saindo ? "Saindo..." : "Sair"}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Logado como <strong>{usuario?.nome ?? "Administrador"}</strong> ({roleLabel}).
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Use esta área para transferir titularidade de uma loja para outro perfil.
        </p>

        {erro ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {erro}
          </p>
        ) : null}

        {resultado ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Transferência concluída: loja <strong>{resultado.lojaId}</strong> agora pertence ao usuário{" "}
            <strong>{resultado.novoOwnerId}</strong>.
          </p>
        ) : null}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="loja-id" className="mb-1 block text-sm font-medium text-gray-800">
              ID da loja
            </label>
            <input
              id="loja-id"
              type="text"
              value={lojaId}
              onChange={(e) => setLojaId(e.target.value)}
              placeholder="Ex.: 2f53193d-c710-4170-a620-f800d4d8af0c"
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none ring-purple-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="owner-id" className="mb-1 block text-sm font-medium text-gray-800">
              ID do novo dono
            </label>
            <input
              id="owner-id"
              type="text"
              value={novoOwnerId}
              onChange={(e) => setNovoOwnerId(e.target.value)}
              placeholder="Ex.: b0b29291-14c2-44f8-bf3c-31c30bc598c2"
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none ring-purple-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="motivo" className="mb-1 block text-sm font-medium text-gray-800">
              Motivo da transferência
            </label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none ring-purple-500 focus:ring-2"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-purple-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
          >
            {enviando ? "Transferindo..." : "Transferir loja"}
          </button>
        </form>
      </section>
    </main>
  );
}
