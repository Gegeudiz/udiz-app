import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDataProvider } from "@/lib/repositories/provider";
import { userRepo } from "@/lib/repositories/localDb";
import type { Usuario } from "@/lib/types";

function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Email ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu email no link enviado pelo Supabase antes de entrar.";
  if (m.includes("user already registered")) return "Este email já está cadastrado. Use Entrar.";
  if (m.includes("password")) return "Senha inválida (mínimo costuma ser 6 caracteres).";
  return message;
}

export async function syncUserFromSupabaseSession(): Promise<Usuario | null> {
  if (getDataProvider() !== "supabase") return null;
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const uid = session.user.id;
  const { data: row } = await supabase
    .from("usuarios")
    .select("nome, foto, bio")
    .eq("id", uid)
    .maybeSingle();

  let nome =
    row?.nome ??
    (typeof session.user.user_metadata?.nome === "string" ? session.user.user_metadata.nome : null) ??
    session.user.email?.split("@")[0] ??
    "Usuário";
  nome = nome.trim().length >= 2 ? nome.trim() : "Usuário";

  const u: Usuario = {
    id: uid,
    nome,
    foto: row?.foto ?? null,
    bio: typeof row?.bio === "string" ? row.bio : "",
  };
  const saved = userRepo.write(u);
  if (!saved.ok) return null;
  return saved.data;
}

export async function signInWithEmailPassword(email: string, password: string): Promise<{ ok: true; user: Usuario } | { ok: false; message: string }> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { ok: false, message: authErrorMessage(error.message) };
  if (!data.user) return { ok: false, message: "Não foi possível obter o usuário após o login." };
  const u = await syncUserFromSupabaseSession();
  if (!u) return { ok: false, message: "Sessão criada, mas não foi possível carregar o perfil." };
  return { ok: true, user: u };
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  nome: string
): Promise<
  | { ok: true; user: Usuario; accessToken: string }
  | { ok: false; message: string }
  | { ok: "confirm_email"; message: string }
> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { nome: nome.trim() || "Usuário" } },
  });
  if (error) return { ok: false, message: authErrorMessage(error.message) };

  if (data.session && data.user && data.session.access_token) {
    const u = await syncUserFromSupabaseSession();
    if (u) return { ok: true, user: u, accessToken: data.session.access_token };
  }

  return {
    ok: "confirm_email",
    message:
      "No painel do Supabase, desative a confirmação obrigatória de email (Authentication → Email) para entrar na hora. Enquanto estiver ativa, use o link enviado pelo Supabase e depois Entrar.",
  };
}

export async function signOutSupabase(): Promise<void> {
  if (getDataProvider() !== "supabase") return;
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
}

/** Email do usuário na sessão Auth (Supabase). */
export async function getSupabaseSessionUserEmail(): Promise<string | null> {
  if (getDataProvider() !== "supabase") return null;
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.email?.trim() ?? null;
}

/** Altera a senha do usuário logado (sessão ativa), sem revalidar a atual. */
export async function updateSupabasePassword(
  newPassword: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (getDataProvider() !== "supabase") {
    return { ok: false, message: "Alteração de senha só está disponível com login na nuvem." };
  }
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, message: authErrorMessage(error.message) };
  return { ok: true };
}

/**
 * Confirma a senha atual com novo login e aplica a nova senha.
 * (A senha nunca é armazenada em texto no app; o usuário digita a atual para provar que é ele.)
 */
export async function reauthenticateAndUpdatePassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (getDataProvider() !== "supabase") {
    return { ok: false, message: "Alteração de senha só está disponível com login na nuvem." };
  }
  const supabase = createSupabaseBrowserClient();
  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: currentPassword,
  });
  if (signErr) {
    const m = signErr.message.toLowerCase();
    if (m.includes("invalid") || m.includes("credentials")) {
      return { ok: false, message: "Senha atual incorreta." };
    }
    return { ok: false, message: authErrorMessage(signErr.message) };
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, message: authErrorMessage(error.message) };
  return { ok: true };
}

/** Envia email do Supabase com link para redefinir senha (configure Redirect URLs no painel). */
export async function sendPasswordResetEmail(
  email: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (getDataProvider() !== "supabase") {
    return { ok: false, message: "Recuperação de senha só está disponível com login na nuvem." };
  }
  const supabase = createSupabaseBrowserClient();
  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });
  if (error) return { ok: false, message: authErrorMessage(error.message) };
  return { ok: true };
}
