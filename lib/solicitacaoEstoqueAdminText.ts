import type { EstoqueSolicitacaoRow } from "@/lib/supabase/estoqueSolicitacao";

function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return "********";
  const visiblePrefix = digits.slice(0, 2);
  const visibleSuffix = digits.slice(-2);
  const hiddenLen = Math.max(0, digits.length - 4);
  return `${visiblePrefix}${"*".repeat(hiddenLen)}${visibleSuffix}`;
}

/** Texto único para WhatsApp (CallMeBot) e e-mail de alerta à equipe. */
export function montarTextoAdminNovaSolicitacao(row: EstoqueSolicitacaoRow): string {
  const sql = `update public.estoque_solicitacoes set status = 'approved', updated_at = now() where id = '${row.id}';`;
  return [
    "📋 Nova solicitação — Udiz Estoque",
    "",
    `ID da linha: ${row.id}`,
    `user_id (Supabase): ${row.user_id}`,
    `Nome do dono: ${row.nome_completo_dono}`,
    `CPF (mascarado): ${maskCpf(row.cpf)}`,
    `Segmento: ${row.segmento}`,
    `Cidade: ${row.cidade}`,
    `Bairro: ${row.bairro}`,
    `Endereço: ${row.endereco}`,
    `CEP: ${row.cep}`,
    `WhatsApp da loja (mascarado): ${maskPhone(row.whatsapp)}`,
    "",
    "Obs.: dados sensíveis foram mascarados nesta notificação.",
    "",
    "Aprovar (SQL Editor):",
    sql,
  ].join("\n");
}
