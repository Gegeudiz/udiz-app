"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fileToDataUrl, validateImageFile } from "@/lib/files";
import { getDataProvider } from "@/lib/repositories/provider";
import { lojaRepo } from "@/lib/repositories/localDb";
import { remoteCreateLoja } from "@/lib/supabase/estoqueRemote";
import { trackEvent } from "@/lib/telemetry";
import { readUsuario } from "@/lib/usuario";

export default function CriarLoja() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [endereco, setEndereco] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [imagem, setImagem] = useState<string | null>(null);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [erro, setErro] = useState("");

  const handleSubmit = async () => {
    const usuario = readUsuario();
    if (!usuario) {
      router.replace("/?estoque=1");
      return;
    }

    let criado =
      getDataProvider() === "supabase"
        ? await remoteCreateLoja({
            nome,
            descricao,
            endereco,
            whatsapp,
            imagem,
            imagemFile,
          })
        : lojaRepo.create({
            nome,
            descricao,
            endereco,
            whatsapp,
            imagem,
            ownerId: usuario.id,
          });
    if (!criado.ok) {
      setErro(criado.message);
      return;
    }
    trackEvent("estoque_loja_criada", { userId: usuario.id, lojaId: criado.data.id });
    router.push("/estoque");
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      const fileError = validateImageFile(file);
      if (fileError) {
        setErro(fileError);
        return;
      }
      try {
        setImagemFile(file);
        setImagem(await fileToDataUrl(file));
        setErro("");
      } catch {
        setImagemFile(null);
        setImagem(null);
        setErro("Não foi possível processar a imagem.");
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Criar nova loja</h1>

      <input
        placeholder="Nome da loja"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="w-full mb-3 p-2 border border-gray-300 rounded-lg"
      />

      <input
        placeholder="Endereço da loja"
        value={endereco}
        onChange={(e) => setEndereco(e.target.value)}
        className="w-full mb-3 p-2 border border-gray-300 rounded-lg"
      />

      <input
        placeholder="WhatsApp"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        className="w-full mb-3 p-2 border border-gray-300 rounded-lg"
      />

      <textarea
        placeholder="Descrição da loja"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        className="w-full mb-3 p-2 border border-gray-300 rounded-lg min-h-[100px]"
      />

      <label htmlFor="udiz-nova-loja-foto" className="block text-sm font-semibold text-gray-800 mb-1">
        Foto da loja (opcional)
      </label>
      <p className="text-xs text-gray-600 mb-2">
        Com Supabase ativo, a foto vai para o Storage e o link é salvo na tabela <code className="text-xs bg-gray-100 px-1 rounded">lojas</code>.
      </p>
      <input
        id="udiz-nova-loja-foto"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => void handleImage(e)}
        className="mb-3 w-full text-sm"
      />

      {imagem ? (
        <div className="mb-3 flex flex-col gap-2">
          <img src={imagem} alt="Preview da loja" className="w-32 h-32 object-cover rounded-lg" />
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
