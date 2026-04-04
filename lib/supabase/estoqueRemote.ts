import { lojaComEnderecoMapsAtualizado, montarEnderecoParaGoogleMaps } from "@/lib/enderecoLoja";
import { mapLoja, mapProduto, type LojaRow, type ProdutoRow } from "@/lib/supabase/mapRows";
import { requireSupabaseSession } from "@/lib/supabase/requireSession";
import { resolveImageInput } from "@/lib/supabase/storageUpload";
import { lojaSchema, produtoSchema, validateSchema, type ValidationResult } from "@/lib/schemas/domain";
import type { Loja, Produto } from "@/lib/types";

export async function remoteListMinhasLojas(): Promise<Loja[]> {
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return [];
  const { data, error } = await ctx.supabase
    .from("lojas")
    .select("*")
    .eq("owner_id", ctx.userId)
    .order("nome");
  if (error) throw error;
  return (data as LojaRow[]).map(mapLoja);
}

export async function remoteListProdutosDaLoja(lojaId: string): Promise<Produto[]> {
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return [];
  const { data: loja, error: e0 } = await ctx.supabase
    .from("lojas")
    .select("id")
    .eq("id", lojaId)
    .eq("owner_id", ctx.userId)
    .maybeSingle();
  if (e0) throw e0;
  if (!loja) return [];

  const { data, error } = await ctx.supabase
    .from("produtos")
    .select("*")
    .eq("loja_id", lojaId)
    .order("nome");
  if (error) throw error;
  return (data as ProdutoRow[]).map(mapProduto);
}

export async function remoteCreateLoja(payload: {
  nome: string;
  descricao: string;
  whatsapp: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  imagem: string | null;
  imagemFile?: File | null;
}): Promise<ValidationResult<Loja>> {
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  let imagem: string | null = payload.imagem;
  try {
    const draftKey = `${ctx.userId}/drafts/loja-${crypto.randomUUID()}`;
    imagem = await resolveImageInput(ctx.supabase, ctx.userId, draftKey, {
      file: payload.imagemFile,
      previewUrl: payload.imagem,
      allowInlineFallbackWhenBucketMissing: true,
    });
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Não foi possível enviar a foto da loja.",
    };
  }

  const cidade = payload.cidade.trim();
  const bairro = payload.bairro.trim();
  const logradouro = payload.logradouro.trim();
  const numero = payload.numero.trim();
  const complemento = payload.complemento.trim();
  const endereco = montarEnderecoParaGoogleMaps({
    cidade,
    bairro,
    logradouro,
    numero,
    complemento,
  });

  const insert = {
    owner_id: ctx.userId,
    nome: payload.nome.trim(),
    descricao: payload.descricao.trim(),
    cidade,
    bairro,
    logradouro,
    numero,
    complemento,
    endereco,
    whatsapp: payload.whatsapp.trim(),
    imagem,
  };

  const { data, error } = await ctx.supabase.from("lojas").insert(insert).select("*").single();
  if (error) return { ok: false, message: error.message || "Não foi possível criar a loja." };

  const loja = mapLoja(data as LojaRow);
  return validateSchema(lojaSchema, loja, "Dados da loja inválidos");
}

export async function remoteUpdateLoja(
  lojaId: string,
  changes: Partial<
    Pick<
      Loja,
      | "nome"
      | "descricao"
      | "endereco"
      | "cidade"
      | "bairro"
      | "logradouro"
      | "numero"
      | "complemento"
      | "whatsapp"
      | "imagem"
    >
  >,
  options?: { imagemFile?: File | null }
): Promise<ValidationResult<Loja>> {
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { data: existing, error: e0 } = await ctx.supabase
    .from("lojas")
    .select("*")
    .eq("id", lojaId)
    .eq("owner_id", ctx.userId)
    .maybeSingle();
  if (e0) return { ok: false, message: e0.message };
  if (!existing) return { ok: false, message: "Loja não encontrada" };

  const row = existing as LojaRow;
  const merged: Loja = lojaComEnderecoMapsAtualizado({
    ...mapLoja(row),
    ...changes,
    id: row.id,
    ownerId: ctx.userId,
  });

  let imagemOut = merged.imagem;
  try {
    const capaKey = `${ctx.userId}/lojas/${lojaId}/capa`;
    imagemOut = await resolveImageInput(ctx.supabase, ctx.userId, capaKey, {
      file: options?.imagemFile,
      previewUrl: merged.imagem,
      allowInlineFallbackWhenBucketMissing: true,
    });
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Não foi possível enviar a foto da loja.",
    };
  }

  const fixed = lojaComEnderecoMapsAtualizado({ ...merged, imagem: imagemOut });
  const patch = {
    nome: fixed.nome.trim(),
    descricao: fixed.descricao.trim(),
    cidade: fixed.cidade.trim(),
    bairro: fixed.bairro.trim(),
    logradouro: fixed.logradouro.trim(),
    numero: fixed.numero.trim(),
    complemento: fixed.complemento.trim(),
    endereco: fixed.endereco.trim(),
    whatsapp: fixed.whatsapp.trim(),
    imagem: imagemOut,
  };

  const { data, error } = await ctx.supabase
    .from("lojas")
    .update(patch)
    .eq("id", lojaId)
    .eq("owner_id", ctx.userId)
    .select("*")
    .single();
  if (error) return { ok: false, message: error.message || "Não foi possível atualizar a loja." };

  const loja = mapLoja(data as LojaRow);
  return validateSchema(lojaSchema, loja, "Dados da loja inválidos");
}

export async function remoteCreateProduto(
  payload: Omit<Produto, "id" | "uuid" | "created_at" | "updated_at"> & {
    imagemFile?: File | null;
  }
): Promise<ValidationResult<Produto>> {
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { data: loja, error: e0 } = await ctx.supabase
    .from("lojas")
    .select("id")
    .eq("id", payload.loja_id)
    .eq("owner_id", ctx.userId)
    .maybeSingle();
  if (e0) return { ok: false, message: e0.message };
  if (!loja) return { ok: false, message: "Loja não encontrada ou sem permissão" };

  let imagem: string | null = payload.imagem;
  try {
    const prodKey = `${ctx.userId}/lojas/${payload.loja_id}/produtos/${crypto.randomUUID()}`;
    imagem = await resolveImageInput(ctx.supabase, ctx.userId, prodKey, {
      file: payload.imagemFile,
      previewUrl: payload.imagem,
      allowInlineFallbackWhenBucketMissing: true,
    });
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Não foi possível enviar a foto do produto.",
    };
  }

  const insert = {
    loja_id: payload.loja_id,
    nome: payload.nome.trim(),
    preco: payload.preco,
    categoria: payload.categoria.trim(),
    descricao: payload.descricao.trim(),
    imagem,
  };

  const { data, error } = await ctx.supabase.from("produtos").insert(insert).select("*").single();
  if (error) return { ok: false, message: error.message || "Não foi possível criar o produto." };

  const p = mapProduto(data as ProdutoRow);
  return validateSchema(produtoSchema, p, "Dados do produto inválidos");
}

export async function remoteUpdateProduto(
  produtoId: string,
  lojaId: string,
  changes: Partial<Pick<Produto, "nome" | "preco" | "categoria" | "descricao" | "imagem">>,
  options?: { imagemFile?: File | null }
): Promise<ValidationResult<Produto>> {
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { data: existing, error: e0 } = await ctx.supabase
    .from("produtos")
    .select("*")
    .eq("id", produtoId)
    .eq("loja_id", lojaId)
    .maybeSingle();
  if (e0) return { ok: false, message: e0.message };
  if (!existing) return { ok: false, message: "Produto não encontrado" };

  const { data: lojaOk } = await ctx.supabase
    .from("lojas")
    .select("id")
    .eq("id", lojaId)
    .eq("owner_id", ctx.userId)
    .maybeSingle();
  if (!lojaOk) return { ok: false, message: "Sem permissão para editar este produto" };

  const cur = mapProduto(existing as ProdutoRow);
  const next: Produto = {
    ...cur,
    ...changes,
    id: cur.id,
    loja_id: lojaId,
  };

  let imagemOut = next.imagem;
  try {
    const prodKey = `${ctx.userId}/lojas/${lojaId}/produtos/${produtoId}`;
    imagemOut = await resolveImageInput(ctx.supabase, ctx.userId, prodKey, {
      file: options?.imagemFile,
      previewUrl: next.imagem,
      allowInlineFallbackWhenBucketMissing: true,
    });
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Não foi possível enviar a foto do produto.",
    };
  }

  const patch = {
    nome: next.nome.trim(),
    preco: next.preco,
    categoria: next.categoria.trim(),
    descricao: next.descricao.trim(),
    imagem: imagemOut,
  };

  const { data, error } = await ctx.supabase
    .from("produtos")
    .update(patch)
    .eq("id", produtoId)
    .eq("loja_id", lojaId)
    .select("*")
    .single();
  if (error) return { ok: false, message: error.message || "Não foi possível atualizar o produto." };

  const p = mapProduto(data as ProdutoRow);
  return validateSchema(produtoSchema, p, "Dados do produto inválidos");
}

export async function remoteListMeusProdutos(): Promise<Produto[]> {
  const lojas = await remoteListMinhasLojas();
  if (lojas.length === 0) return [];
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return [];
  const ids = lojas.map((l) => l.id);
  const { data, error } = await ctx.supabase
    .from("produtos")
    .select("*")
    .in("loja_id", ids)
    .order("nome");
  if (error) throw error;
  return (data as ProdutoRow[]).map(mapProduto);
}

export async function remoteGetLojaDoDono(lojaId: string): Promise<Loja | null> {
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return null;
  const { data, error } = await ctx.supabase
    .from("lojas")
    .select("*")
    .eq("id", lojaId)
    .eq("owner_id", ctx.userId)
    .maybeSingle();
  if (error || !data) return null;
  return mapLoja(data as LojaRow);
}

export async function remoteDeleteLoja(
  lojaId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return { ok: false, message: ctx.error };
  const { error } = await ctx.supabase
    .from("lojas")
    .delete()
    .eq("id", lojaId)
    .eq("owner_id", ctx.userId);
  if (error) {
    return {
      ok: false,
      message: error.message || "Não foi possível excluir a loja. Tente de novo.",
    };
  }
  return { ok: true };
}

export async function remoteDeleteProduto(
  produtoId: string,
  lojaId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return { ok: false, message: ctx.error };
  const { data: lojaOk } = await ctx.supabase
    .from("lojas")
    .select("id")
    .eq("id", lojaId)
    .eq("owner_id", ctx.userId)
    .maybeSingle();
  if (!lojaOk) {
    return { ok: false, message: "Somente o dono da loja pode excluir produtos." };
  }
  const { error } = await ctx.supabase
    .from("produtos")
    .delete()
    .eq("id", produtoId)
    .eq("loja_id", lojaId);
  if (error) {
    return {
      ok: false,
      message: error.message || "Não foi possível excluir o produto. Tente de novo.",
    };
  }
  return { ok: true };
}
