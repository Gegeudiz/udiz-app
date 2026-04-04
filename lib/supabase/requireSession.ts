import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SupabaseSessionContext =
  | { supabase: ReturnType<typeof createSupabaseBrowserClient>; userId: string }
  | { error: string };

export async function requireSupabaseSession(): Promise<SupabaseSessionContext> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.user) {
    return {
      error:
        "Sua sessão não está ativa no Supabase. Entre com email e senha (não use o login de demonstração).",
    };
  }
  return { supabase, userId: session.user.id };
}
