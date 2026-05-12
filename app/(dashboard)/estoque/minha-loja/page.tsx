"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fileToDataUrl, optimizeImageForUpload, validateImageFile } from "@/lib/files";
import {
  extrairEnderecoGoogleMaps,
  montarEnderecoParaGoogleMaps,
  rotuloLocalPublicoLoja,
} from "@/lib/enderecoLoja";
import type { Loja, Produto } from "@/lib/types";
import { canEditLoja } from "@/lib/authz";
import { findLojaById, getLojasFromStorage, getProdutosFromStorage } from "@/lib/catalogo";
import { getDataProvider } from "@/lib/repositories/provider";
import { lojaRepo, produtoRepo } from "@/lib/repositories/localDb";
import ConfirmarExclusaoModal from "@/components/ConfirmarExclusaoModal";
import {
  remoteCreateProduto,
  remoteDeleteLoja,
  remoteDeleteProduto,
  remoteDuplicateProdutoParaLoja,
  remoteGetLojaDoDono,
  remoteListMinhasLojas,
  remoteListProdutosDaLoja,
  remoteUpdateLoja,
  remoteUpdateProduto,
} from "@/lib/supabase/estoqueRemote";
import {
  PRODUCT_CARD_GRID_CLASS,
  PRODUCT_CARD_SURFACE_CLASS,
  ProductCardImageArea,
  ProductCardNome,
  ProductCardPreco,
} from "@/components/ProductCardLayout";
import { mensagemErroApiParaUsuario } from "@/lib/mensagemErroApi";
import { trackEvent } from "@/lib/telemetry";
import { readUsuario } from "@/lib/usuario";
import { CATEGORIAS_UDIZ, migrarRotuloCategoriaArmazenada } from "@/lib/categoriasUdiz";

function MinhaLojaContent() {
  const params = useSearchParams();
  const router = useRouter();
  const lojaId = params.get("id") ?? "";

  const [loja, setLoja] = useState<Loja | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [produtoEditandoId, setProdutoEditandoId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);

  const [modalLojaAberto, setModalLojaAberto] = useState(false);
  const [lojaNome, setLojaNome] = useState("");
  const [lojaEnderecoGoogleMaps, setLojaEnderecoGoogleMaps] = useState("");
  const [lojaCidade, setLojaCidade] = useState("");
  const [lojaBairro, setLojaBairro] = useState("");
  const [lojaLogradouro, setLojaLogradouro] = useState("");
  const [lojaNumero, setLojaNumero] = useState("");
  const [lojaComplemento, setLojaComplemento] = useState("");
  const [lojaWhatsapp, setLojaWhatsapp] = useState("");
  const [lojaDescricao, setLojaDescricao] = useState("");
  const [lojaImagemPreview, setLojaImagemPreview] = useState<string | null>(null);
  const [lojaImagemFile, setLojaImagemFile] = useState<File | null>(null);
  const [produtoImagemFile, setProdutoImagemFile] = useState<File | null>(null);
  const lojaFotoInputRef = useRef<HTMLInputElement>(null);
  const lojaFotoCameraInputRef = useRef<HTMLInputElement>(null);
  const produtoFotoInputRef = useRef<HTMLInputElement>(null);
  const produtoFotoCameraInputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [excluirDialog, setExcluirDialog] = useState<
    null | { tipo: "loja"; nome: string } | { tipo: "produto"; id: string; nome: string }
  >(null);
  const [excluindo, setExcluindo] = useState(false);

  /** Lojas do utilizador logado (para decidir se mostra duplicar entre lojas). */
  const [minhasLojas, setMinhasLojas] = useState<Loja[]>([]);
  const [duplicarModalProduto, setDuplicarModalProduto] = useState<Produto | null>(null);
  const [lojaDestinoDuplicarId, setLojaDestinoDuplicarId] = useState("");
  const [duplicandoProduto, setDuplicandoProduto] = useState(false);

  const recarregar = useCallback(() => {
    const usuario = readUsuario();
    if (!usuario || !lojaId) {
      setLoja(null);
      setMinhasLojas([]);
      return;
    }
    void (async () => {
      if (getDataProvider() === "supabase") {
        const todasMinhas = await remoteListMinhasLojas();
        setMinhasLojas(todasMinhas);
        const l = await remoteGetLojaDoDono(lojaId);
        if (!l || !canEditLoja(usuario, l)) {
          setLoja(null);
          return;
        }
        setLoja(l);
        const lista = await remoteListProdutosDaLoja(lojaId);
        setProdutos(lista);
        return;
      }
      const lojas = getLojasFromStorage().filter((lo) => lo.ownerId === usuario.id);
      setMinhasLojas(lojas);
      const l = findLojaById(lojas, lojaId);
      if (!l || !canEditLoja(usuario, l)) {
        setLoja(null);
        return;
      }
      setLoja(l);
      const todos = getProdutosFromStorage();
      setProdutos(todos.filter((p) => p.loja_id === lojaId));
    })();
  }, [lojaId]);

  useEffect(() => {
    const timer = window.setTimeout(() => recarregar(), 0);
    return () => window.clearTimeout(timer);
  }, [recarregar]);

  const abrirModalNovaLoja = () => {
    if (!loja) return;
    setErro("");
    setLojaNome(loja.nome);
    setLojaEnderecoGoogleMaps("");
    setLojaCidade(loja.cidade ?? "");
    setLojaBairro(loja.bairro ?? "");
    setLojaLogradouro(loja.logradouro ?? "");
    setLojaNumero(loja.numero ?? "");
    setLojaComplemento(loja.complemento ?? "");
    setLojaWhatsapp(loja.whatsapp);
    setLojaDescricao(loja.descricao);
    setLojaImagemFile(null);
    setLojaImagemPreview(loja.imagem);
    setModalLojaAberto(true);
  };

  const preencherEnderecoLojaDoMaps = () => {
    const extraido = extrairEnderecoGoogleMaps(lojaEnderecoGoogleMaps);
    if (!extraido) {
      setErro("Não foi possível extrair o endereço. Confira o texto copiado do Google Maps.");
      return;
    }
    setLojaCidade(extraido.cidade);
    setLojaBairro(extraido.bairro);
    setLojaLogradouro(extraido.logradouro);
    setLojaNumero(extraido.numero);
    setLojaComplemento(extraido.complemento);
    setErro("");
  };

  const salvarLoja = async () => {
    const usuario = readUsuario();
    if (!usuario || !loja || !canEditLoja(usuario, loja)) return;
    const cidade = lojaCidade.trim();
    const bairro = lojaBairro.trim();
    const logradouro = lojaLogradouro.trim();
    const numero = lojaNumero.trim();
    const complemento = lojaComplemento.trim();
    if (!cidade || !bairro || !logradouro || !numero) {
      setErro("Preencha cidade, bairro, rua/avenida e número (ou S/N).");
      return;
    }
    if (!lojaWhatsapp.trim()) {
      setErro("Informe o WhatsApp da loja.");
      return;
    }
    setErro("");
    const endereco = montarEnderecoParaGoogleMaps({
      cidade,
      bairro,
      logradouro,
      numero,
      complemento,
    });
    const result =
      getDataProvider() === "supabase"
        ? await remoteUpdateLoja(
            lojaId,
            {
              nome: lojaNome.trim(),
              descricao: lojaDescricao.trim(),
              cidade,
              bairro,
              logradouro,
              numero,
              complemento,
              endereco,
              whatsapp: lojaWhatsapp.trim(),
              imagem: lojaImagemPreview,
            },
            { imagemFile: lojaImagemFile }
          )
        : lojaRepo.update(lojaId, usuario.id, {
            nome: lojaNome.trim(),
            descricao: lojaDescricao.trim(),
            cidade,
            bairro,
            logradouro,
            numero,
            complemento,
            endereco,
            whatsapp: lojaWhatsapp.trim(),
            imagem: lojaImagemPreview,
          });
    if (!result.ok) {
      setErro(mensagemErroApiParaUsuario(result.message));
      return;
    }
    trackEvent("estoque_loja_editada", { userId: usuario.id, lojaId });
    setSucesso("Loja atualizada com sucesso.");
    fecharModalLoja();
    recarregar();
  };

  const handleLojaFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const optimized = await optimizeImageForUpload(file);
      const fileError = validateImageFile(optimized);
      if (fileError) {
        setErro(fileError);
        return;
      }
      setLojaImagemFile(optimized);
      setLojaImagemPreview(await fileToDataUrl(optimized));
      setErro("");
    } catch {
      setLojaImagemFile(null);
      setLojaImagemPreview(null);
      setErro("Não foi possível processar a imagem.");
    }
  };

  const abrirModalNovoProduto = () => {
    setErro("");
    setProdutoEditandoId(null);
    setNome("");
    setPreco("");
    setCategoria("");
    setDescricao("");
    setProdutoImagemFile(null);
    setImagemPreview(null);
    setModalProdutoAberto(true);
  };

  const fecharModalProduto = () => {
    setErro("");
    setModalProdutoAberto(false);
    setProdutoEditandoId(null);
    setNome("");
    setPreco("");
    setCategoria("");
    setDescricao("");
    setProdutoImagemFile(null);
    setImagemPreview(null);
  };

  const fecharModalLoja = () => {
    setErro("");
    setModalLojaAberto(false);
    setLojaNome("");
    setLojaEnderecoGoogleMaps("");
    setLojaCidade("");
    setLojaBairro("");
    setLojaLogradouro("");
    setLojaNumero("");
    setLojaComplemento("");
    setLojaWhatsapp("");
    setLojaDescricao("");
    setLojaImagemFile(null);
    setLojaImagemPreview(null);
  };

  const abrirModalEditarProduto = (p: Produto) => {
    setErro("");
    setProdutoEditandoId(p.id);
    setNome(p.nome);
    setPreco(String(p.preco));
    setCategoria(migrarRotuloCategoriaArmazenada(p.categoria));
    setDescricao(p.descricao);
    setProdutoImagemFile(null);
    setImagemPreview(p.imagem);
    setModalProdutoAberto(true);
  };

  const salvarProduto = async () => {
    if (salvandoProduto) return;
    if (!categoria.trim()) {
      setErro("Selecione uma categoria.");
      return;
    }
    const usuario = readUsuario();
    if (!usuario || !loja || !canEditLoja(usuario, loja)) return;
    setSalvandoProduto(true);
    try {
      if (produtoEditandoId != null) {
        const result =
          getDataProvider() === "supabase"
            ? await remoteUpdateProduto(
                produtoEditandoId,
                lojaId,
                {
                  nome: nome.trim(),
                  preco: Number(preco) || 0,
                  categoria,
                  descricao: descricao.trim(),
                  imagem: imagemPreview,
                },
                { imagemFile: produtoImagemFile }
              )
            : produtoRepo.update(produtoEditandoId, lojaId, {
                nome: nome.trim(),
                preco: Number(preco) || 0,
                categoria,
                descricao: descricao.trim(),
                imagem: imagemPreview,
              });
        if (!result.ok) {
          setErro(mensagemErroApiParaUsuario(result.message));
          return;
        }
        trackEvent("estoque_produto_editado", { userId: usuario.id, lojaId, produtoId: produtoEditandoId });
        setSucesso("Produto atualizado com sucesso.");
      } else {
        const result =
          getDataProvider() === "supabase"
            ? await remoteCreateProduto({
                nome: nome.trim(),
                preco: Number(preco) || 0,
                categoria,
                loja_id: lojaId,
                descricao: descricao.trim(),
                imagem: imagemPreview,
                imagemFile: produtoImagemFile,
              })
            : produtoRepo.create({
                nome: nome.trim(),
                preco: Number(preco) || 0,
                categoria,
                loja_id: lojaId,
                descricao: descricao.trim(),
                imagem: imagemPreview,
              });
        if (!result.ok) {
          setErro(mensagemErroApiParaUsuario(result.message));
          return;
        }
        trackEvent("estoque_produto_criado", { userId: usuario.id, lojaId, produtoId: result.data.id });
        setSucesso("Produto criado com sucesso.");
      }
      setErro("");
      fecharModalProduto();
      recarregar();
    } finally {
      setSalvandoProduto(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!excluirDialog || !loja) return;
    const usuario = readUsuario();
    if (!usuario || !canEditLoja(usuario, loja)) return;
    setExcluindo(true);
    setErro("");
    try {
      if (excluirDialog.tipo === "loja") {
        const r =
          getDataProvider() === "supabase"
            ? await remoteDeleteLoja(lojaId)
            : lojaRepo.delete(lojaId, usuario.id);
        if (!r.ok) {
          setErro(mensagemErroApiParaUsuario(r.message));
          return;
        }
        trackEvent("estoque_loja_excluida", { userId: usuario.id, lojaId });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("udiz:catalogo-atualizado"));
        }
        setExcluirDialog(null);
        router.push("/estoque");
        return;
      }
      const r =
        getDataProvider() === "supabase"
          ? await remoteDeleteProduto(excluirDialog.id, lojaId)
          : produtoRepo.delete(excluirDialog.id, lojaId);
      if (!r.ok) {
        setErro(mensagemErroApiParaUsuario(r.message));
        return;
      }
      trackEvent("estoque_produto_excluido", {
        userId: usuario.id,
        lojaId,
        produtoId: excluirDialog.id,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("udiz:catalogo-atualizado"));
      }
      setSucesso(`Produto "${excluirDialog.nome}" excluído.`);
      setExcluirDialog(null);
      recarregar();
    } finally {
      setExcluindo(false);
    }
  };

  const mostrarDuplicarEntreLojas = minhasLojas.length > 1;

  const abrirModalDuplicarProduto = (p: Produto) => {
    setErro("");
    const opcoes = minhasLojas.filter((l) => l.id !== lojaId);
    const primeira = opcoes[0];
    if (!primeira) return;
    setDuplicarModalProduto(p);
    setLojaDestinoDuplicarId(primeira.id);
  };

  const fecharModalDuplicarProduto = () => {
    if (duplicandoProduto) return;
    setErro("");
    setDuplicarModalProduto(null);
    setLojaDestinoDuplicarId("");
  };

  const confirmarDuplicarProduto = async () => {
    if (!duplicarModalProduto || !loja || duplicandoProduto) return;
    const usuario = readUsuario();
    if (!usuario || !canEditLoja(usuario, loja)) return;

    const destLoja = minhasLojas.find((l) => l.id === lojaDestinoDuplicarId);
    if (!destLoja || !canEditLoja(usuario, destLoja) || lojaDestinoDuplicarId === lojaId) {
      setErro("Escolha uma loja de destino que seja sua e diferente desta.");
      return;
    }

    setDuplicandoProduto(true);
    setErro("");
    try {
      const result =
        getDataProvider() === "supabase"
          ? await remoteDuplicateProdutoParaLoja({
              produtoId: duplicarModalProduto.id,
              lojaOrigemId: lojaId,
              lojaDestinoId: lojaDestinoDuplicarId,
            })
          : produtoRepo.create({
              nome: duplicarModalProduto.nome,
              preco: Number(duplicarModalProduto.preco),
              categoria: duplicarModalProduto.categoria,
              loja_id: lojaDestinoDuplicarId,
              descricao: duplicarModalProduto.descricao,
              imagem: duplicarModalProduto.imagem,
            });
      if (!result.ok) {
        setErro(mensagemErroApiParaUsuario(result.message));
        return;
      }
      trackEvent("estoque_produto_duplicado", {
        userId: usuario.id,
        lojaOrigemId: lojaId,
        lojaDestinoId: lojaDestinoDuplicarId,
        produtoOrigemId: duplicarModalProduto.id,
        produtoNovoId: result.data.id,
        destinoLojaNome: destLoja.nome,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("udiz:catalogo-atualizado"));
      }
      setSucesso(`Produto enviado para "${destLoja.nome}".`);
      setDuplicarModalProduto(null);
      setLojaDestinoDuplicarId("");
    } finally {
      setDuplicandoProduto(false);
    }
  };

  const handleFotoProduto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const optimized = await optimizeImageForUpload(file);
      const fileError = validateImageFile(optimized);
      if (fileError) {
        setErro(fileError);
        return;
      }
      setProdutoImagemFile(optimized);
      setImagemPreview(await fileToDataUrl(optimized));
      setErro("");
    } catch {
      setProdutoImagemFile(null);
      setImagemPreview(null);
      setErro("Não foi possível processar a imagem.");
    }
  };

  if (!loja) {
    return (
      <div className="max-w-xl mx-auto py-6">
        <p className="text-gray-600">Loja não encontrada ou você não tem permissão.</p>
        <button
          type="button"
          onClick={() => router.push("/estoque")}
          className="mt-4 text-purple-600 font-medium underline"
        >
          Voltar ao gerenciamento
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6">
      <button
        type="button"
        onClick={() => router.push("/estoque")}
        className="text-sm text-purple-600 hover:underline mb-4"
      >
        ← Voltar às lojas
      </button>
      {erro && !modalLojaAberto && !modalProdutoAberto && !excluirDialog && !duplicarModalProduto ? (
        <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {erro}
        </p>
      ) : null}
      {sucesso && <p className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{sucesso}</p>}

      <div className="flex flex-col md:flex-row md:items-start gap-6 mb-6">
        {loja.imagem ? (
          <img
            src={loja.imagem}
            alt={loja.nome}
            className="w-full md:w-48 h-40 object-cover rounded-xl border border-gray-200"
          />
        ) : (
          <div className="w-full md:w-48 h-40 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
            Sem foto
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{loja.nome}</h1>
          <p className="text-gray-600 mt-1">
            {rotuloLocalPublicoLoja(loja) || loja.endereco}
          </p>
          <p className="text-purple-700 mt-2 text-sm">WhatsApp: {loja.whatsapp}</p>
          {loja.descricao ? (
            <p className="text-sm text-gray-500 mt-2">{loja.descricao}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={abrirModalNovaLoja}
              className="text-sm font-semibold text-purple-700 border border-purple-300 hover:bg-purple-50 px-4 py-2 rounded-lg"
            >
              Editar loja
            </button>
            <button
              type="button"
              onClick={() => loja && setExcluirDialog({ tipo: "loja", nome: loja.nome })}
              className="text-sm font-semibold text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg"
            >
              Excluir loja
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={abrirModalNovoProduto}
        className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold mb-8"
      >
        + Adicionar produtos
      </button>

      <h2 className="font-bold text-gray-900 mb-3">Produtos desta loja</h2>
      {produtos.length === 0 ? (
        <p className="text-gray-600 text-sm">Nenhum produto cadastrado ainda.</p>
      ) : (
        <div className={PRODUCT_CARD_GRID_CLASS}>
          {produtos.map((p) => (
            <div
              key={p.id}
              className={`${PRODUCT_CARD_SURFACE_CLASS} text-left`}
            >
              <ProductCardImageArea src={p.imagem} alt={p.nome} />
              <ProductCardNome>{p.nome}</ProductCardNome>
              <ProductCardPreco valor={Number(p.preco)} />
              <p className="text-xs text-gray-500">{p.categoria}</p>
              <div className="mt-auto pt-2 flex flex-wrap gap-x-3 gap-y-1">
                <button
                  type="button"
                  onClick={() => abrirModalEditarProduto(p)}
                  className="text-xs font-semibold text-purple-700 hover:underline text-left"
                >
                  Editar
                </button>
                {mostrarDuplicarEntreLojas ? (
                  <button
                    type="button"
                    onClick={() => abrirModalDuplicarProduto(p)}
                    className="text-xs font-semibold text-purple-700 hover:underline text-left"
                  >
                    Enviar para outra Loja
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setExcluirDialog({ tipo: "produto", id: p.id, nome: p.nome })}
                  className="text-xs font-semibold text-red-600 hover:underline text-left"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalLojaAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Editar loja</h3>
            <p className="text-xs text-gray-500 mb-4">
              Somente você (dono da loja) vê e altera estes dados. Visitantes do Udiz não editam sua loja.
            </p>
            {erro ? (
              <p
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {erro}
              </p>
            ) : null}

            <input
              placeholder="Nome da loja"
              value={lojaNome}
              onChange={(e) => setLojaNome(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 text-gray-900"
            />
            <p className="text-xs font-semibold text-gray-700 mt-2 mb-1">Endereço</p>
            <textarea
              placeholder="Cole o endereço do Google Maps e clique em Preencher endereço"
              value={lojaEnderecoGoogleMaps}
              onChange={(e) => setLojaEnderecoGoogleMaps(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 min-h-[72px] text-gray-900"
            />
            <button
              type="button"
              onClick={preencherEnderecoLojaDoMaps}
              className="mb-2 inline-flex items-center justify-center rounded-lg border border-orange-300 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50"
            >
              Preencher endereço a partir do Google Maps
            </button>
            <input
              placeholder="Cidade"
              value={lojaCidade}
              onChange={(e) => setLojaCidade(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 text-gray-900"
            />
            <input
              placeholder="Bairro"
              value={lojaBairro}
              onChange={(e) => setLojaBairro(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 text-gray-900"
            />
            <input
              placeholder="Rua / avenida"
              value={lojaLogradouro}
              onChange={(e) => setLojaLogradouro(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 text-gray-900"
            />
            <input
              placeholder="Número ou S/N"
              value={lojaNumero}
              onChange={(e) => setLojaNumero(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 text-gray-900"
            />
            <input
              placeholder="Complemento (opcional)"
              value={lojaComplemento}
              onChange={(e) => setLojaComplemento(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 text-gray-900"
            />
            <input
              placeholder="WhatsApp"
              value={lojaWhatsapp}
              onChange={(e) => setLojaWhatsapp(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 text-gray-900"
            />
            <textarea
              placeholder="Descrição da loja"
              value={lojaDescricao}
              onChange={(e) => setLojaDescricao(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 min-h-[80px] text-gray-900"
            />
            <span className="block text-sm font-semibold text-gray-800 mb-1">Foto da loja</span>
            <input
              ref={lojaFotoInputRef}
              id="udiz-loja-foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void handleLojaFoto(e)}
              className="sr-only"
            />
            <input
              ref={lojaFotoCameraInputRef}
              id="udiz-loja-foto-camera"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) => void handleLojaFoto(e)}
              className="sr-only"
            />
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => lojaFotoCameraInputRef.current?.click()}
                className="inline-flex items-center justify-center rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                aria-label="Tirar foto da loja"
              >
                Tirar foto
              </button>
              <button
                type="button"
                onClick={() => lojaFotoInputRef.current?.click()}
                className="inline-flex items-center justify-center rounded-lg border border-purple-300 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
                aria-label="Escolher foto da loja na galeria"
              >
                Escolher da galeria
              </button>
            </div>
            {lojaImagemPreview ? (
              <div className="mb-3 flex flex-col gap-2">
                <img
                  src={lojaImagemPreview}
                  alt="Preview da loja"
                  className="w-28 h-28 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setLojaImagemFile(null);
                    setLojaImagemPreview(null);
                  }}
                  className="text-sm text-red-600 font-medium hover:underline self-start"
                >
                  Remover foto
                </button>
              </div>
            ) : null}

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => void salvarLoja()}
                disabled={
                  !lojaNome.trim() ||
                  !lojaCidade.trim() ||
                  !lojaBairro.trim() ||
                  !lojaLogradouro.trim() ||
                  !lojaNumero.trim() ||
                  !lojaWhatsapp.trim()
                }
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                Salvar alterações
              </button>
              <button
                type="button"
                onClick={fecharModalLoja}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmarExclusaoModal
        aberto={excluirDialog != null}
        erro={excluirDialog && erro ? erro : undefined}
        titulo={
          excluirDialog?.tipo === "loja"
            ? "Excluir loja?"
            : excluirDialog?.tipo === "produto"
              ? "Excluir produto?"
              : ""
        }
        descricao={
          excluirDialog?.tipo === "loja"
            ? `Tem certeza que deseja excluir a loja "${excluirDialog.nome}"? Todos os produtos desta loja serão removidos. Esta ação não pode ser desfeita.`
            : excluirDialog?.tipo === "produto"
              ? `Tem certeza que deseja excluir o produto "${excluirDialog.nome}"? Esta ação não pode ser desfeita.`
              : ""
        }
        onCancelar={() => {
          if (!excluindo) {
            setErro("");
            setExcluirDialog(null);
          }
        }}
        onConfirmar={() => void confirmarExclusao()}
        carregando={excluindo}
      />

      {duplicarModalProduto ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Enviar produto para outra loja</h3>
            <p className="text-sm text-gray-600 mb-4">
              Será criada uma cópia de{" "}
              <strong className="text-gray-900">{duplicarModalProduto.nome}</strong> na loja de destino. Preço,
              categoria, descrição e imagem seguem iguais.
            </p>
            {erro ? (
              <p
                role="alert"
                className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {erro}
              </p>
            ) : null}
            <label htmlFor="udiz-destino-duplicar" className="block text-sm font-semibold text-gray-800 mb-1">
              Loja de destino
            </label>
            <select
              id="udiz-destino-duplicar"
              value={lojaDestinoDuplicarId}
              onChange={(e) => setLojaDestinoDuplicarId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 text-gray-900"
            >
              {minhasLojas
                .filter((l) => l.id !== lojaId)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void confirmarDuplicarProduto()}
                disabled={duplicandoProduto || !lojaDestinoDuplicarId}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {duplicandoProduto ? "Enviando…" : "Enviar"}
              </button>
              <button
                type="button"
                onClick={fecharModalDuplicarProduto}
                disabled={duplicandoProduto}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalProdutoAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {produtoEditandoId != null ? "Editar produto" : "Novo produto"}
            </h3>
            {erro ? (
              <p
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {erro}
              </p>
            ) : null}

            <input
              placeholder="Nome do produto"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 text-gray-900"
            />

            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 text-gray-900"
            >
              <option value="">Selecione a categoria</option>
              {CATEGORIAS_UDIZ.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="Preço"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 text-gray-900"
            />

            <textarea
              placeholder="Descrição do produto"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 min-h-[88px] text-gray-900"
            />

            <span className="block text-sm font-semibold text-gray-800 mb-1">Foto do produto</span>
            <input
              ref={produtoFotoInputRef}
              id="udiz-produto-foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void handleFotoProduto(e)}
              className="sr-only"
            />
            <input
              ref={produtoFotoCameraInputRef}
              id="udiz-produto-foto-camera"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) => void handleFotoProduto(e)}
              className="sr-only"
            />
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => produtoFotoCameraInputRef.current?.click()}
                className="inline-flex items-center justify-center rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                aria-label="Tirar foto do produto"
              >
                Tirar foto
              </button>
              <button
                type="button"
                onClick={() => produtoFotoInputRef.current?.click()}
                className="inline-flex items-center justify-center rounded-lg border border-purple-300 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
                aria-label="Escolher foto do produto na galeria"
              >
                Escolher da galeria
              </button>
            </div>

            {imagemPreview ? (
              <div className="mb-3 flex flex-col gap-2">
                <img
                  src={imagemPreview}
                  alt="Preview do produto"
                  className="w-28 h-28 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setProdutoImagemFile(null);
                    setImagemPreview(null);
                  }}
                  className="text-sm text-red-600 font-medium hover:underline self-start"
                >
                  Remover foto
                </button>
              </div>
            ) : null}

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => void salvarProduto()}
                disabled={!nome.trim() || !categoria || preco === "" || salvandoProduto}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {salvandoProduto ? "Salvando..." : produtoEditandoId != null ? "Salvar alterações" : "Salvar"}
              </button>
              <button
                type="button"
                onClick={fecharModalProduto}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MinhaLoja() {
  return (
    <Suspense fallback={<div className="py-6 text-gray-600">Carregando...</div>}>
      <MinhaLojaContent />
    </Suspense>
  );
}
