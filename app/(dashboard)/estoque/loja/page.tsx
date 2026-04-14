"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fileToDataUrl, optimizeImageForUpload, validateImageFile } from "@/lib/files";
import { montarEnderecoParaGoogleMaps } from "@/lib/enderecoLoja";
import { getDataProvider } from "@/lib/repositories/provider";
import { lojaRepo } from "@/lib/repositories/localDb";
import { mensagemErroApiParaUsuario } from "@/lib/mensagemErroApi";
import { remoteCreateLoja } from "@/lib/supabase/estoqueRemote";
import { trackEvent } from "@/lib/telemetry";
import { readUsuario } from "@/lib/usuario";

export default function CriarLoja() {
  const router = useRouter();
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const fotoCameraInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState<string | null>(null);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [erro, setErro] = useState("");

  const handleSubmit = async () => {
    const usuario = readUsuario();
    if (!usuario) {
      router.replace("/?estoque=1");
      return;
    }

    if (!nome.trim()) {
      setErro("Informe o nome da loja.");
      return;
    }
    if (!cidade.trim() || !bairro.trim() || !logradouro.trim() || !numero.trim()) {
      setErro("Preencha cidade, bairro, rua/avenida e número (ou S/N).");
      return;
    }
    if (!whatsapp.trim()) {
      setErro("Informe o WhatsApp da loja para os clientes entrarem em contato.");
      return;
    }

    const endereco = montarEnderecoParaGoogleMaps({
      cidade: cidade.trim(),
      bairro: bairro.trim(),
      logradouro: logradouro.trim(),
      numero: numero.trim(),
      complemento: complemento.trim(),
    });

    const payloadBase = {
      nome: nome.trim(),
      descricao: descricao.trim(),
      cidade: cidade.trim(),
      bairro: bairro.trim(),
      logradouro: logradouro.trim(),
      numero: numero.trim(),
      complemento: complemento.trim(),
      endereco,
      whatsapp: whatsapp.trim(),
      imagem,
    };

    const criado =
      getDataProvider() === "supabase"
        ? await remoteCreateLoja({
            nome: payloadBase.nome,
            descricao: payloadBase.descricao,
            whatsapp: payloadBase.whatsapp,
            cidade: payloadBase.cidade,
            bairro: payloadBase.bairro,
            logradouro: payloadBase.logradouro,
            numero: payloadBase.numero,
            complemento: payloadBase.complemento,
            imagem: payloadBase.imagem,
            imagemFile,
          })
        : lojaRepo.create({
            ...payloadBase,
            ownerId: usuario.id,
          });
    if (!criado.ok) {
      setErro(mensagemErroApiParaUsuario(criado.message));
      return;
    }
    trackEvent("estoque_loja_criada", { userId: usuario.id, lojaId: criado.data.id });
    router.push("/estoque");
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setImagemFile(optimized);
      setImagem(await fileToDataUrl(optimized));
      setErro("");
    } catch {
      setImagemFile(null);
      setImagem(null);
      setErro("Não foi possível processar a imagem.");
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Criar nova loja</h1>

      <label className="block text-sm font-semibold text-gray-800 mb-1">Nome da loja</label>
      <input
        placeholder="Nome da loja"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="w-full mb-4 p-2 border border-gray-300 rounded-lg text-gray-900"
      />

      <p className="text-sm font-semibold text-gray-800 mb-2">Endereço</p>
      <p className="text-xs text-gray-500 mb-3">
        Usamos estes dados para montar o endereço completo no Google Maps ao cliente tocar em &quot;Ir até à
        loja&quot;. Na ficha do produto só aparecem bairro e cidade.
      </p>

      <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
      <input
        placeholder="Ex.: Uberlândia"
        value={cidade}
        onChange={(e) => setCidade(e.target.value)}
        className="w-full mb-2 p-2 border border-gray-300 rounded-lg text-gray-900"
      />

      <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
      <input
        placeholder="Bairro"
        value={bairro}
        onChange={(e) => setBairro(e.target.value)}
        className="w-full mb-2 p-2 border border-gray-300 rounded-lg text-gray-900"
      />

      <label className="block text-xs font-medium text-gray-600 mb-1">Rua / avenida</label>
      <input
        placeholder="Nome da rua ou avenida"
        value={logradouro}
        onChange={(e) => setLogradouro(e.target.value)}
        className="w-full mb-2 p-2 border border-gray-300 rounded-lg text-gray-900"
      />

      <label className="block text-xs font-medium text-gray-600 mb-1">Número / sem número</label>
      <input
        placeholder="Número ou S/N"
        value={numero}
        onChange={(e) => setNumero(e.target.value)}
        className="w-full mb-2 p-2 border border-gray-300 rounded-lg text-gray-900"
      />

      <label className="block text-xs font-medium text-gray-600 mb-1">Complemento (opcional)</label>
      <input
        placeholder="Apto, bloco, referência…"
        value={complemento}
        onChange={(e) => setComplemento(e.target.value)}
        className="w-full mb-4 p-2 border border-gray-300 rounded-lg text-gray-900"
      />

      <label className="block text-sm font-semibold text-gray-800 mb-1">
        WhatsApp da loja <span className="text-red-600">*</span>
      </label>
      <p className="text-xs text-gray-500 mb-1">
        DDD + número — usado no botão &quot;Falar com a Loja&quot; na página do produto.
      </p>
      <input
        placeholder="DDD + número"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        className="w-full mb-4 p-2 border border-gray-300 rounded-lg text-gray-900"
        inputMode="tel"
        autoComplete="tel"
      />

      <label className="block text-sm font-semibold text-gray-800 mb-1">Descrição da loja</label>
      <textarea
        placeholder="Descrição da loja"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        className="w-full mb-4 p-2 border border-gray-300 rounded-lg min-h-[100px] text-gray-900"
      />

      <span className="block text-sm font-semibold text-gray-800 mb-1">Foto da loja (opcional)</span>
      <input
        ref={fotoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => void handleImage(e)}
        className="sr-only"
      />
      <input
        ref={fotoCameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(e) => void handleImage(e)}
        className="sr-only"
      />
      <div className="mb-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fotoCameraInputRef.current?.click()}
          className="inline-flex items-center justify-center rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
        >
          Tirar foto
        </button>
        <button
          type="button"
          onClick={() => fotoInputRef.current?.click()}
          className="inline-flex items-center justify-center rounded-lg border border-purple-300 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
        >
          Escolher da galeria
        </button>
      </div>

      {imagem ? (
        <div className="mb-4 flex flex-col gap-2">
          <img src={imagem} alt="Preview da loja" className="w-32 h-32 object-cover rounded-lg border border-gray-200" />
          <button
            type="button"
            onClick={() => {
              setImagemFile(null);
              setImagem(null);
            }}
            className="text-sm text-red-600 font-medium hover:underline self-start"
          >
            Remover foto
          </button>
        </div>
      ) : null}

      {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold"
      >
        Salvar loja
      </button>
    </div>
  );
}
