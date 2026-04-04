import { getDataProvider } from "@/lib/repositories/provider";
import { userRepo } from "@/lib/repositories/localDb";
import { syncUserFromSupabaseSession } from "@/lib/supabase/authSession";
import type { Usuario } from "./types";

export function readUsuario(): Usuario | null {
  return userRepo.read();
}

export function writeUsuario(u: Usuario) {
  userRepo.write(u);
}

/** Com provider Supabase, repovoa o perfil local a partir da sessão Auth (útil após F5). */
export async function refreshUsuarioFromSupabaseSession(): Promise<void> {
  if (getDataProvider() !== "supabase") return;
  await syncUserFromSupabaseSession();
}

export const PENDING_ESTOQUE_KEY = "udiz_pending_estoque";

