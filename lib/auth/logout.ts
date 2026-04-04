import { signOutSupabase } from "@/lib/supabase/authSession";
import { getDataProvider } from "@/lib/repositories/provider";
import { userRepo } from "@/lib/repositories/localDb";

/** Encerra sessão Supabase (se aplicável) e limpa o perfil local. */
export async function encerrarSessaoApp(): Promise<void> {
  if (getDataProvider() === "supabase") {
    await signOutSupabase();
  }
  userRepo.clear();
}
