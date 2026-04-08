import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Cliente browser único (evita vários GoTrueClient e comportamento estranho da sessão).
 * No servidor, cada chamada devolve uma instância nova (não cachear em RSC).
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local"
    );
  }

  if (typeof window === "undefined") {
    return createClient(url, anon);
  }

  if (!browserClient) {
    browserClient = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        /** Necessário para processar links de email no callback. */
        detectSessionInUrl: true,
        /**
         * IMPORTANTE:
         * Não forçar PKCE no cliente browser para recuperação de senha.
         * Com PKCE, o link pode exigir "code_verifier" salvo no mesmo device e falhar
         * quando o usuário abre no celular/outro navegador ("code verifier not found in storage").
         */
        flowType: "implicit",
      },
    });
  }
  return browserClient;
}
