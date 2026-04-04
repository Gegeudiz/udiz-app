import type { Loja, Produto } from "@/lib/types";

export type LojaRow = {
  id: string;
  owner_id: string;
  nome: string;
  descricao: string;
  endereco: string;
  cidade?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  whatsapp: string;
  imagem: string | null;
  created_at: string;
  updated_at: string;
};

export type ProdutoRow = {
  id: string;
  loja_id: string;
  nome: string;
  preco: string | number;
  categoria: string;
  descricao: string;
  imagem: string | null;
  created_at: string;
  updated_at: string;
};

export function mapLoja(row: LojaRow): Loja {
  return {
    id: row.id,
    uuid: row.id,
    nome: row.nome,
    descricao: row.descricao ?? "",
    endereco: row.endereco,
    cidade: row.cidade ?? "",
    bairro: row.bairro ?? "",
    logradouro: row.logradouro ?? "",
    numero: row.numero ?? "",
    complemento: row.complemento ?? "",
    whatsapp: row.whatsapp,
    imagem: row.imagem,
    ownerId: row.owner_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapProduto(row: ProdutoRow): Produto {
  return {
    id: row.id,
    uuid: row.id,
    nome: row.nome,
    preco: Number(row.preco),
    categoria: row.categoria,
    loja_id: row.loja_id,
    descricao: row.descricao ?? "",
    imagem: row.imagem,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
