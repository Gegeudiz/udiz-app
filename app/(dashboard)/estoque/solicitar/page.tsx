"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  estoqueAccessSkippedLocally,
  remoteEnviarSolicitacaoEstoque,
  remoteUltimaSolicitacaoEstoque,
  remoteUsuarioTemAcessoEstoque,
  type EstoqueSolicitacaoRow,
} from "@/lib/supabase/estoqueSolicitacao";
import { requestNotificarAdminNovaSolicitacao } from "@/lib/notifySolicitacaoClient";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/telemetry";
import { readUsuario } from "@/lib/usuario";

export default function SolicitarAcessoEstoquePage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [ultima, setUltima] = useState<EstoqueSolicitacaoRow | null>(null);
  const [temAcesso, setTemAcesso] = useState(false);

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cpf, setCpf] = useState("");
  const [segmento, setSegmento] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucessoEnvio, setSucessoEnvio] = useState(false);

  const recarregarEstado = useCallback(async () => {
    if (estoqueAccessSkippedLocally()) {
      setTemAcesso(true);
      setUltima(null);
      setCarregando(false);
      router.replace("/estoque");
      return;
    }
    const [ok, u] = await Promise.all([
      remoteUsuarioTemAcessoEstoque(),
      remoteUltimaSolicitacaoEstoque(),
    ]);
    setTemAcesso(ok);
    setUltima(u);
    setCarregando(false);
    if (ok) {
      router.replace("/estoque");
    }
  }, [router]);

  useEffect(() => {
    const u = readUsuario();
    if (!u) {
      router.replace("/?estoque=1");
      return;
    }
    void recarregarEstado();
  }, [router, recarregarEstado]);

  useEffect(() => {
    const onFocus = () => void recarregarEstado();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [recarregarEstado]);

  const submit = async () => {
    setErro("");
    setSucessoEnvio(false);
    setEnviando(true);
    const r = await remoteEnviarSolicitacaoEstoque({
      nomeCompletoDono: nomeCompleto,
      cpf,
      segmento,
      cidade,
      bairro,
      endereco,
      cep,
      whatsapp,
    });
    setEnviando(false);
    if (!r.ok) {
      setErro(r.message);
      return;
    }
    const usuario = readUsuario();
    if (usuario) {
      trackEvent("estoque_solicitacao_enviada", { userId: usuario.id });
    }
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      requestNotificarAdminNovaSolicitacao(session.access_token, r.id);
    }
    setSucessoEnvio(true);
    setNomeCompleto("");
    setCpf("");
    setSegmento("");
    setCidade("");
    setBairro("");
    setEndereco("");
    setCep("");
    setWhatsapp("");
    await recarregarEstado();
  };

  if (carregando) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-gray-600">
        Carregando…
      </div>
    );
  }

  if (temAcesso) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-gray-600">
        Redirecionando para o painel…
      </div>
    );
  }

  const localSkip = estoqueAccessSkippedLocally();

  if (localSkip) {
    return null;
  }

  const pendente = ultima?.status === "pending";
  const rejeitada = ultima?.status === "rejected";

  return (
    <div className="max-w-2xl mx-auto py-6 px-1">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Cadastro — Udiz Estoque</h1>
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        O painel do Udiz Estoque é liberado após análise da nossa equipe. Preencha os dados da sua
        loja com atenção (endereço compatível com mapas). Você receberá acesso para cadastrar lojas
        e produtos quando a solicitação for aprovada.
      </p>

      {pendente && !sucessoEnvio ? (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-6 text-amber-950 mb-8"
        >
          <p className="font-semibold text-lg">Status: pendente</p>
          <p className="mt-2 text-sm leading-relaxed">
            Recebemos sua solicitação em{" "}
            {ultima
              ? new Date(ultima.created_at).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "—"}
            . Nossa equipe vai analisar e liberar o acesso em breve. Você pode fechar esta página —
            quando for aprovado, use novamente <strong>Udiz Estoque</strong> no menu.
          </p>
        </div>
      ) : null}

      {sucessoEnvio && pendente ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-900 text-sm mb-6">
          <p>
            Solicitação registrada com sucesso. <strong>Status: pendente</strong> — aguarde a análise
            da equipe.
          </p>
          <p className="mt-2">
            Nossa equipe recebe o alerta automaticamente (WhatsApp e/ou e-mail, conforme configurado no
            servidor). Você não precisa enviar mensagem manualmente.
          </p>
        </div>
      ) : null}

      {rejeitada && !pendente ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-900 text-sm mb-6">
          Sua última solicitação não foi aprovada. Se acredita que foi um engano, envie uma nova
          solicitação com os dados atualizados ou entre em contato com o suporte.
        </div>
      ) : null}

      {!pendente || rejeitada ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Dados para inclusão</h2>

          <label className="block text-sm font-medium text-gray-700">
            Nome completo do dono da loja
            <input
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              autoComplete="name"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            CPF (somente números)
            <input
              value={cpf}
              onChange={(e) => setCpf(e.target.value.replace(/\D/g, "").slice(0, 11))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              inputMode="numeric"
              maxLength={11}
              placeholder="00000000000"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Segmento da loja (por extenso)
            <input
              value={segmento}
              onChange={(e) => setSegmento(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              placeholder="Ex.: cosméticos e perfumaria"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-gray-700">
              Cidade
              <input
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                placeholder="Ex.: Uberlândia"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Bairro
              <input
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Endereço (rua, número, complemento — como no Google Maps)
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              placeholder="Ex.: Rua Exemplo, 123, sala 2"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            CEP (8 dígitos)
            <input
              value={cep}
              onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              inputMode="numeric"
              maxLength={8}
              placeholder="00000000"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            WhatsApp da loja
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              inputMode="tel"
              autoComplete="tel"
              placeholder="DDD + número"
            />
          </label>

          {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

          <button
            type="button"
            disabled={enviando}
            onClick={() => void submit()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
          >
            {enviando ? "Enviando…" : "Solicitar inclusão da minha loja no Udiz"}
          </button>
        </div>
      ) : null}

      <p className="mt-6 text-xs text-gray-500 leading-relaxed">
        Após o envio, a equipe Udiz analisa o cadastro. Com aprovação, o mesmo login passa a abrir o
        painel completo (várias lojas e produtos).
      </p>
    </div>
  );
}
