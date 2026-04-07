"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Loja, Produto } from "@/lib/types";
import { getDataProvider } from "@/lib/repositories/provider";
import { lojaRepo, produtoRepo } from "@/lib/repositories/localDb";
import { remoteListMeusProdutos, remoteListMinhasLojas } from "@/lib/supabase/estoqueRemote";
import { readEvents } from "@/lib/telemetry";
import { rotuloLocalPublicoLoja } from "@/lib/enderecoLoja";
import { readUsuario } from "@/lib/usuario";

/** Sugestões fixas para inspirar o lojista — o que costuma ter boa procura no varejo. */
const IDEIAS_PRODUTOS_EM_ALTA = [
  {
    nome: "Kit escolar e papelaria",
    categoria: "Escola",
    dica: "Cadernos, estojos e kits voltam forte no começo do ano e em rematrículas.",
  },
  {
    nome: "Skincare e autocuidado",
    categoria: "Cosméticos",
    dica: "Hidratantes, protetor solar e itens de rotina têm busca constante.",
  },
  {
    nome: "Decoração e festas",
    categoria: "Festas",
    dica: "Itens para aniversário e datas comemorativas costumam puxar vendas sazonais.",
  },
  {
    nome: "Pet shop (ração e acessórios)",
    categoria: "Pet",
    dica: "Donos de pet buscam praticidade; combos e reposição frequente ajudam.",
  },
] as const;

export default function EstoqueGerenciamentoPage() {
  const router = useRouter();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");

  useEffect(() => {
    const usuario = readUsuario();
    if (!usuario) {
      setLoading(false);
      return;
    }
    setNomeUsuario(usuario.nome);
    void (async () => {
      try {
        if (getDataProvider() === "supabase") {
          const minhasLojas = await remoteListMinhasLojas();
          setLojas(minhasLojas);
          const meusProdutos = await remoteListMeusProdutos();
          setProdutos(meusProdutos);
        } else {
          const todas = lojaRepo.list();
          const minhasLojas = todas.filter((l) => l.ownerId === usuario.id);
          setLojas(minhasLojas);
          const idsLojas = new Set(minhasLojas.map((l) => l.id));
          const meusProdutos = produtoRepo.list().filter((p) => idsLojas.has(p.loja_id));
          setProdutos(meusProdutos);
        }
      } catch {
        setErro("Não foi possível carregar suas lojas agora.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dadosBusca = useMemo(() => {
    const eventos = readEvents();
    const contagemPorProduto = new Map<string, number>();

    eventos.forEach((ev) => {
      if (ev.event !== "produto_whatsapp_click" && ev.event !== "produto_salvo_toggle") return;
      const raw = ev.payload?.produtoId;
      const produtoId = raw != null && raw !== "" ? String(raw) : "";
      if (!produtoId) return;
      if (ev.event === "produto_salvo_toggle" && ev.payload?.saved !== true) return;
      contagemPorProduto.set(produtoId, (contagemPorProduto.get(produtoId) ?? 0) + 1);
    });

    const top = produtos
      .map((p) => ({ produto: p, interesse: contagemPorProduto.get(p.id) ?? 0 }))
      .sort((a, b) => b.interesse - a.interesse)
      .slice(0, 4);

    return top;
  }, [produtos]);

  const totalProdutos = produtos.length;
  const totalLojas = lojas.length;
  const ticketMedio =
    totalProdutos > 0
      ? produtos.reduce((acc, p) => acc + Number(p.preco || 0), 0) / totalProdutos
      : 0;
  const incentivo =
    totalProdutos === 0
      ? "Comece adicionando seus primeiros produtos para aparecer na busca do Udiz."
      : dadosBusca.length > 0 && dadosBusca[0].interesse > 0
        ? `Seu destaque atual é "${dadosBusca[0].produto.nome}". Reforce foto e descrição para converter mais vendas.`
        : "Seus produtos já estão publicados. Incentive cliques com títulos mais claros e fotos de boa qualidade.";

  return (
    <div className="max-w-6xl mx-auto py-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-700 via-violet-600 to-cyan-500 text-white p-6 md:p-8 shadow-lg mb-6">
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-12 left-1/3 w-56 h-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative">
          <p className="text-sm text-white/90">Painel inteligente do lojista</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">
            Olá, {nomeUsuario || "Lojista"} 👋
          </h1>
          <p className="text-sm md:text-base text-white/90 mt-2 max-w-3xl">
            Aqui você acompanha o desempenho básico do seu catálogo e identifica oportunidades
            para vender mais.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <article className="rounded-xl border border-purple-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-purple-600 font-semibold">Lojas</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalLojas}</p>
          <p className="text-xs text-gray-500 mt-1">Operando no marketplace</p>
        </article>
        <article className="rounded-xl border border-cyan-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-cyan-600 font-semibold">
            Produtos Cadastrados
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalProdutos}</p>
          <p className="text-xs text-gray-500 mt-1">Visíveis para quem busca</p>
        </article>
        <article className="rounded-xl border border-fuchsia-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-fuchsia-600 font-semibold">
            Ticket Médio
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            R$ {ticketMedio.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-gray-500 mt-1">Média dos seus preços</p>
        </article>
        <article className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">
            Ação Rápida
          </p>
          <button
            type="button"
            onClick={() => router.push("/estoque/loja")}
            className="mt-2 w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm py-2.5 font-semibold"
          >
            + Criar nova loja
          </button>
          <p className="text-xs text-gray-500 mt-2">Expanda seu catálogo</p>
        </article>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <article className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">O que as pessoas mais procuram ultimamente</h2>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Ideias de tendência para você se inspirar e cadastrar no seu estoque — quando esses itens
            aparecem na busca do Udiz, sua loja pode ser encontrada por quem já está procurando.
          </p>
          <ul className="space-y-3">
            {IDEIAS_PRODUTOS_EM_ALTA.map((item, idx) => (
              <li
                key={item.nome}
                className="rounded-lg border border-purple-100 bg-purple-50/40 p-3"
              >
                <p className="text-sm font-semibold text-gray-900">
                  #{idx + 1} {item.nome}
                </p>
                <p className="text-xs text-purple-700 font-medium mt-0.5">{item.categoria}</p>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">{item.dica}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-gray-200 bg-gradient-to-br from-indigo-50 to-cyan-50 p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-900">Nota:</h3>
          <p className="text-sm text-gray-700 mt-3 leading-relaxed">{incentivo}</p>
          <button
            type="button"
            disabled={loading || lojas.length === 0}
            title={
              lojas.length === 0 && !loading
                ? "Cadastre uma loja para ver a vitrine como o cliente"
                : undefined
            }
            onClick={() => {
              if (lojas.length === 0) return;
              const id = lojas[0]!.id;
              window.open(`/loja/${encodeURIComponent(id)}`, "_blank", "noopener,noreferrer");
            }}
            className="mt-4 w-full rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-2.5 font-semibold"
          >
            Ver como o cliente acessa a minha Loja
          </button>
          {lojas.length > 1 ? (
            <p className="text-xs text-gray-600 mt-2">
              Com mais de uma loja, este atalho abre a vitrine da primeira. Em cada card abaixo há
              também o link direto para aquela loja.
            </p>
          ) : null}
        </article>
      </section>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
          Carregando suas lojas...
        </div>
      ) : erro ? (
        <div className="bg-red-50 rounded-xl border border-red-200 p-8 text-center text-red-700">
          {erro}
        </div>
      ) : lojas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
          Você ainda não tem lojas cadastradas. Clique em <strong>Criar nova loja</strong> para
          começar.
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Suas lojas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lojas.map((loja) => (
            <div
              key={loja.id}
              className="text-left bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
            >
              <button
                type="button"
                onClick={() => router.push(`/estoque/minha-loja?id=${loja.id}`)}
                className="text-left w-full"
              >
                {loja.imagem ? (
                  <img
                    src={loja.imagem}
                    alt={loja.nome}
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                    Sem foto
                  </div>
                )}
                <div className="p-4 pb-2">
                  <h2 className="font-bold text-gray-900">{loja.nome}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {rotuloLocalPublicoLoja(loja) || loja.endereco}
                  </p>
                  <p className="text-sm text-purple-700 mt-2">WhatsApp: {loja.whatsapp}</p>
                  <p className="text-xs text-purple-600 mt-3 font-medium">Gerenciar loja →</p>
                </div>
              </button>
              <div className="px-4 pb-4 pt-0">
                <Link
                  href={`/loja/${encodeURIComponent(loja.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 hover:underline"
                >
                  Ver como o cliente acessa esta loja
                </Link>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
