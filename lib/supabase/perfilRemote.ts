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

  // upsert: cria a linha em public.usuarios se o trigger on_auth_user_created
  // não tiver rodado (migração antiga / projeto sem trigger). update sozinho não
  // insere e o PostgREST costuma não retornar erro quando 0 linhas batem.
  const { error } = await ctx.supabase.from("usuarios").upsert(
    {
      id: ctx.userId,
      nome: input.nome.trim(),
      bio: input.bio.trim(),
      foto,
    },
    { onConflict: "id" }
  );

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
