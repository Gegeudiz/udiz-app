-- Cole no Supabase → SQL Editor → Run
-- Adiciona checkbox "em_destaque" nos produtos e permite admin marcar destaques no app.

alter table public.produtos
  add column if not exists em_destaque boolean not null default false;

create index if not exists produtos_em_destaque_idx on public.produtos (em_destaque)
  where em_destaque = true;

drop policy if exists "produtos_update_admin" on public.produtos;
create policy "produtos_update_admin"
  on public.produtos for update
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.role in ('admin', 'super_admin')
    )
  );
