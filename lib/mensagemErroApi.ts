/**
 * Converte respostas técnicas (Supabase, PostgREST, rede) em texto legível em português.
 * Mensagens que já parecem estar em PT (validação do app) são mantidas.
 */
export function mensagemErroApiParaUsuario(raw: string): string {
  const m = raw.trim();
  if (!m) return "Ocorreu um erro inesperado. Tente de novo.";

  const lower = m.toLowerCase();

  // Coluna / schema (PostgREST)
  const colunaTabela = /could not find the ['"]([^'"]+)['"] column of ['"]([^'"]+)['"]/i.exec(m);
  if (colunaTabela) {
    return `O banco de dados ainda não está atualizado: falta a coluna “${colunaTabela[1]}” na tabela “${colunaTabela[2]}”. No painel do Supabase, abra o SQL Editor e execute o script da migração mais recente em supabase/migrations (arquivos .sql), depois tente salvar de novo.`;
  }

  if (/column\s+["']?\w+["']?\s+does not exist/i.test(m) || /42703/.test(m)) {
    return "Falta uma coluna no banco de dados. Rode as migrações SQL do projeto no Supabase (SQL Editor → cole o conteúdo do arquivo de migração → Run).";
  }

  if (/relation\s+["']?\w+["']?\s+does not exist/i.test(m)) {
    return "Uma tabela necessária não existe no banco. Verifique se todas as migrações SQL foram aplicadas no Supabase.";
  }

  if (/jwt expired|token.*expired|session.*expired/i.test(lower)) {
    return "Sua sessão expirou. Use Sair e entre de novo na conta.";
  }

  if (/duplicate key|unique constraint|already exists/i.test(lower)) {
    return "Este dado já existe ou entra em conflito com outro registro.";
  }

  if (/permission denied|row level security|new row violates row-level security/i.test(lower)) {
    return "Sem permissão para esta ação. Confirme se está logado com a conta correta.";
  }

  if (/invalid.*uuid|22P02/i.test(lower)) {
    return "Identificador inválido. Atualize a página e tente de novo.";
  }

  if (/failed to fetch|networkerror|load failed|network request failed/i.test(lower)) {
    return "Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.";
  }

  if (/payload too large|413/i.test(lower)) {
    return "Arquivo ou dados muito grandes. Tente uma imagem menor.";
  }

  // Heurística: já em português (validação Zod / app)
  if (
    /[ãõáéíóúâêôç]/i.test(m) ||
    /^(informe|preencha|selecione|o nome|a descrição|não foi|somente|use apenas|este campo|mínimo|máximo)/i.test(
      m
    )
  ) {
    return m;
  }

  return `Não foi possível concluir a operação. Detalhe: ${m}`;
}
