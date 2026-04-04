import type { SupabaseClient } from "@supabase/supabase-js";

export const UDIZ_UPLOADS_BUCKET = "udiz-uploads";

export function extFromDataUrl(dataUrl: string): "jpg" | "png" | "webp" {
  const m = /^data:image\/(jpeg|jpg|png|webp)/i.exec(dataUrl);
  if (!m) return "webp";
  const t = m[1].toLowerCase();
  if (t === "jpeg" || t === "jpg") return "jpg";
  if (t === "png") return "png";
  return "webp";
}

export function extFromFile(file: File): "jpg" | "png" | "webp" {
  const t = (file.type || "").toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("jpeg") || t === "image/jpg") return "jpg";
  return "webp";
}

function mimeForExt(ext: "jpg" | "png" | "webp"): string {
  if (ext === "jpg") return "image/jpeg";
  if (ext === "png") return "image/png";
  return "image/webp";
}

function storageErrorMessage(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("bucket not found") || m.includes("not found") || m.includes("does not exist")) {
    return [
      "O bucket de arquivos ainda não existe no seu projeto.",
      "Opção A — SQL: no Supabase abra SQL → New query, cole o arquivo",
      "supabase/migrations/20260202140000_storage_udiz_uploads.sql do projeto e clique Run.",
      "Opção B — painel: Storage → New bucket → nome exato udiz-uploads → marque Public → Create;",
      "depois rode no SQL Editor só o bloco create policy (a partir de drop policy...) do mesmo arquivo.",
    ].join(" ");
  }
  if (m.includes("row-level security") || m.includes("rls") || m.includes("policy")) {
    return "Permissão negada no Storage. Confirme que está logado com Supabase Auth e que as policies do bucket foram aplicadas.";
  }
  return raw;
}

function isBucketMissingErrorMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("bucket not found") ||
    m.includes("does not exist") ||
    m.includes("bucket de arquivos ainda não existe")
  );
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/**
 * Envia um arquivo escolhido pelo usuário (recomendado no browser).
 */
export async function uploadImageFile(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  objectKeyNoExt: string
): Promise<string> {
  if (!objectKeyNoExt.startsWith(`${userId}/`)) {
    throw new Error("Caminho de upload inválido.");
  }
  const ext = extFromFile(file);
  const pathWithExt = `${objectKeyNoExt}.${ext}`;
  const contentType =
    file.type && file.type.startsWith("image/") ? file.type : mimeForExt(ext);

  const { error } = await supabase.storage.from(UDIZ_UPLOADS_BUCKET).upload(pathWithExt, file, {
    contentType,
    upsert: true,
  });
  if (error) {
    throw new Error(storageErrorMessage(error.message || "Falha ao enviar imagem."));
  }

  const { data } = supabase.storage.from(UDIZ_UPLOADS_BUCKET).getPublicUrl(pathWithExt);
  return data.publicUrl;
}

/**
 * Se `imagem` for data URL, envia ao Storage e devolve URL pública.
 * Se já for http(s), devolve igual. Se null, null.
 */
export async function resolveImageForStorage(
  supabase: SupabaseClient,
  userId: string,
  imagem: string | null,
  objectKeyNoExt: string
): Promise<string | null> {
  if (imagem == null || imagem === "") return null;
  if (imagem.startsWith("http://") || imagem.startsWith("https://")) {
    return imagem;
  }
  if (!imagem.startsWith("data:")) {
    return imagem;
  }
  if (!objectKeyNoExt.startsWith(`${userId}/`)) {
    throw new Error("Caminho de upload inválido.");
  }
  const ext = extFromDataUrl(imagem);
  const pathWithExt = `${objectKeyNoExt}.${ext}`;
  const blob = await dataUrlToBlob(imagem);
  const contentType = blob.type && blob.type.startsWith("image/") ? blob.type : mimeForExt(ext);

  const { error } = await supabase.storage.from(UDIZ_UPLOADS_BUCKET).upload(pathWithExt, blob, {
    contentType,
    upsert: true,
  });
  if (error) {
    throw new Error(storageErrorMessage(error.message || "Falha ao enviar imagem."));
  }

  const { data } = supabase.storage.from(UDIZ_UPLOADS_BUCKET).getPublicUrl(pathWithExt);
  return data.publicUrl;
}

/** Preferência: arquivo direto; senão data URL / URL já existente. */
export async function resolveImageInput(
  supabase: SupabaseClient,
  userId: string,
  objectKeyNoExt: string,
  opts: {
    file?: File | null;
    previewUrl?: string | null;
    allowInlineFallbackWhenBucketMissing?: boolean;
  }
): Promise<string | null> {
  const fallbackPreview = opts.previewUrl ?? null;
  const canInlineFallback =
    opts.allowInlineFallbackWhenBucketMissing === true &&
    typeof fallbackPreview === "string" &&
    fallbackPreview.startsWith("data:");

  try {
    if (opts.file) {
      return uploadImageFile(supabase, userId, opts.file, objectKeyNoExt);
    }
    return resolveImageForStorage(supabase, userId, fallbackPreview, objectKeyNoExt);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (canInlineFallback && isBucketMissingErrorMessage(message)) {
      return fallbackPreview;
    }
    throw error;
  }
}
