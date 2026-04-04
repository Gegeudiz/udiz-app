import type { EstoqueSolicitacaoRow } from "@/lib/supabase/estoqueSolicitacao";

/** Texto único para WhatsApp (CallMeBot) e e-mail de alerta à equipe. */
export function montarTextoAdminNovaSolicitacao(row: EstoqueSolicitacaoRow): string {
  const sql = `update public.estoque_solicitacoes set status = 'approved', updated_at = now() where id = '${row.id}';`;
  return [
    "📋 Nova solicitação — Udiz Estoque",
    "",
    `ID da linha: ${row.id}`,
    `user_id (Supabase): ${row.user_id}`,
    `Nome do dono: ${row.nome_completo_dono}`,
    `CPF: ${row.cpf}`,
    `Segmento: ${row.segmento}`,
    `Cidade: ${row.cidade}`,
    `Bairro: ${row.bairro}`,
    `Endereço: ${row.endereco}`,
    `CEP: ${row.cep}`,
    `WhatsApp da loja: ${row.whatsapp}`,
    "",
    "Aprovar (SQL Editor):",
    sql,
  ].join("\n");
}
