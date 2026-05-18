-- Destaques na home: marque produtos com em_destaque = true (checkbox no Supabase ou painel admin).

alter table public.produtos
  add column if not exists em_destaque boolean not null default false;

create index if not exists produtos_em_destaque_idx on public.produtos (em_destaque)
  where em_destaque = true;

-- Admin / super_admin podem atualizar qualquer produto (ex.: marcar destaque no app).
drop policy if exists "produtos_update_admin" on public.produtos;
create policy "produtos_update_admin"
  on public.produtos for update
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.role in ('admin', 'super_admin')
    )
  );
