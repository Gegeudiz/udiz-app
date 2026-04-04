-- Solicitações de acesso ao painel Udiz Estoque (aprovação manual pela equipe).

create table public.estoque_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome_completo_dono text not null,
  cpf text not null,
  segmento text not null,
  cidade text not null,
  bairro text not null,
  endereco text not null,
  cep text not null,
  whatsapp text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index estoque_solicitacoes_user_id_idx on public.estoque_solicitacoes (user_id);
create index estoque_solicitacoes_status_idx on public.estoque_solicitacoes (status);

create trigger estoque_solicitacoes_set_updated_at
  before update on public.estoque_solicitacoes
  for each row execute function public.set_updated_at();

alter table public.estoque_solicitacoes enable row level security;

create policy "estoque_solicitacoes_select_own"
  on public.estoque_solicitacoes for select
  using (auth.uid() = user_id);

create policy "estoque_solicitacoes_insert_own"
  on public.estoque_solicitacoes for insert
  with check (auth.uid() = user_id);

-- Aprovação / rejeição: use o SQL Editor como postgres (bypass RLS) ou service_role.

comment on table public.estoque_solicitacoes is
  'Pedidos de inclusão no Udiz Estoque. status approved libera o painel; pendente/rejected não.';

-- Aprovar manualmente (SQL Editor, role postgres):
-- update public.estoque_solicitacoes
-- set status = 'approved', updated_at = now()
-- where id = 'UUID-DA-LINHA';
-- (ou filtre por user_id após consultar a tabela no Table Editor)
