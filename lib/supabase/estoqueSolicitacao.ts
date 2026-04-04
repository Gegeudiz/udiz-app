import { getDataProvider } from "@/lib/repositories/provider";
import { requireSupabaseSession } from "@/lib/supabase/requireSession";

export type EstoqueSolicitacaoStatus = "pending" | "approved" | "rejected";

export type EstoqueSolicitacaoRow = {
  id: string;
  user_id: string;
  nome_completo_dono: string;
  cpf: string;
  segmento: string;
  cidade: string;
  bairro: string;
  endereco: string;
  cep: string;
  whatsapp: string;
  status: EstoqueSolicitacaoStatus;
  created_at: string;
};

/** Modo local: sem tabela — consideramos liberado para desenvolvimento. */
export function estoqueAccessSkippedLocally(): boolean {
  return getDataProvider() !== "supabase";
}

/** True se existe ao menos uma solicitação aprovada para o usuário. */
export async function remoteUsuarioTemAcessoEstoque(): Promise<boolean> {
  if (estoqueAccessSkippedLocally()) return true;
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return false;
  const { data, error } = await ctx.supabase
    .from("estoque_solicitacoes")
    .select("id")
    .eq("user_id", ctx.userId)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

/** Última solicitação do usuário (mais recente), se houver. */
export async function remoteUltimaSolicitacaoEstoque(): Promise<EstoqueSolicitacaoRow | null> {
  if (estoqueAccessSkippedLocally()) return null;
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return null;
  const { data, error } = await ctx.supabase
    .from("estoque_solicitacoes")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as EstoqueSolicitacaoRow;
}

export type NovaSolicitacaoPayload = {
  nomeCompletoDono: string;
  cpf: string;
  segmento: string;
  cidade: string;
  bairro: string;
  endereco: string;
  cep: string;
  whatsapp: string;
};

function soDigitos(s: string): string {
  return s.replace(/\D/g, "");
}

export async function remoteEnviarSolicitacaoEstoque(
  payload: NovaSolicitacaoPayload
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  if (estoqueAccessSkippedLocally()) {
    return { ok: false, message: "Envio de solicitação só está disponível com Supabase ativo." };
  }
  const ctx = await requireSupabaseSession();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const cpf = soDigitos(payload.cpf);
  const cep = soDigitos(payload.cep);
  if (cpf.length !== 11) {
    return { ok: false, message: "CPF deve ter 11 dígitos." };
  }
  if (cep.length !== 8) {
    return { ok: false, message: "CEP deve ter 8 dígitos." };
  }
  const nome = payload.nomeCompletoDono.trim();
  if (nome.length < 5) {
    return { ok: false, message: "Informe o nome completo do dono da loja." };
  }
  const segmento = payload.segmento.trim();
  if (segmento.length < 3) {
    return { ok: false, message: "Descreva o segmento da loja (por extenso)." };
  }
  const cidade = payload.cidade.trim();
  const bairro = payload.bairro.trim();
  const endereco = payload.endereco.trim();
  if (cidade.length < 2 || bairro.length < 2 || endereco.length < 4) {
    return { ok: false, message: "Preencha cidade, bairro e endereço para localização no mapa." };
  }
  const wa = payload.whatsapp.trim();
  if (wa.replace(/\D/g, "").length < 8) {
    return { ok: false, message: "WhatsApp inválido (mínimo 8 dígitos)." };
  }

  const insert = {
    user_id: ctx.userId,
    nome_completo_dono: nome,
    cpf,
    segmento,
    cidade,
    bairro,
    endereco,
    cep,
    whatsapp: wa,
    status: "pending" as const,
  };

  const { data: created, error } = await ctx.supabase
    .from("estoque_solicitacoes")
    .insert(insert)
    .select("id")
    .single();
  if (error) {
    const raw = (error.message || "").toLowerCase();
    if (
      raw.includes("could not find") ||
      raw.includes("schema cache") ||
      raw.includes("does not exist") ||
      raw.includes("relation") && raw.includes("estoque_solicitacoes")
    ) {
      return {
        ok: false,
        message:
          "O banco ainda não tem a tabela de solicitações. No Supabase, abra SQL → cole e execute o arquivo supabase/migrations/20260402120000_estoque_solicitacoes.sql (ou rode a migração do projeto). Depois tente de novo.",
      };
    }
    return {
      ok: false,
      message: error.message || "Não foi possível enviar a solicitação. Tente novamente.",
    };
  }
  const id = created && typeof (created as { id?: string }).id === "string" ? (created as { id: string }).id : "";
  if (!id) {
    return { ok: false, message: "Solicitação criada, mas não foi possível obter o ID. Tente novamente." };
  }
  return { ok: true, id };
}
