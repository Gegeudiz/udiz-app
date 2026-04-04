import { userRepo } from "@/lib/repositories/localDb";
import { requireSupabaseSession } from "@/lib/supabase/requireSession";
import { resolveImageInput } from "@/lib/supabase/storageUpload";
import type { Usuario } from "@/lib/types";

export async function remoteSaveUsuarioPerfil(input: {
  nome: string;
  bio: string;
  foto: string | null;
  fotoFile?: File | null;
}): Promise<{ ok: true; user: Usuario } | { ok: false; message: string }> {
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  let foto: string | null = input.foto;
  try {
    foto = await resolveImageInput(ctx.supabase, ctx.userId, `${ctx.userId}/avatar`, {
      file: input.fotoFile,
      previewUrl: input.foto,
      allowInlineFallbackWhenBucketMissing: true,
    });
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Não foi possível enviar a foto do perfil.",
    };
  }

  const { error } = await ctx.supabase
    .from("usuarios")
    .update({
      nome: input.nome.trim(),
      bio: input.bio.trim(),
      foto,
    })
    .eq("id", ctx.userId);

  if (error) return { ok: false, message: error.message };

  const saved = userRepo.write({
    id: ctx.userId,
    nome: input.nome.trim(),
    bio: input.bio.trim(),
    foto,
  });
  if (!saved.ok) return { ok: false, message: saved.message };
  return { ok: true, user: saved.data };
}
