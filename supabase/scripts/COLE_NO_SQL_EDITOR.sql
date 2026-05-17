-- =============================================================================
-- COLE TODO ESTE ARQUIVO no Supabase → SQL Editor → New query → Run
-- NÃO cole o caminho do arquivo (ex.: supabase/migrations/...), só o SQL abaixo.
-- =============================================================================

alter table public.usuarios
  add column if not exists role text not null default 'user';

create or replace function public.admin_dashboard_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  papel text;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select coalesce(u.role, 'user') into papel from public.usuarios u where u.id = uid;

  if papel not in ('admin', 'super_admin') then
    raise exception 'forbidden';
  end if;

  return json_build_object(
    'lojas', (select count(*)::int from public.lojas),
    'produtos', (select count(*)::int from public.produtos),
    'usuarios', (select count(*)::int from public.usuarios)
  );
end;
$$;

revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- Opcional: confira se sua conta admin tem o papel correto (troque o email):
-- update public.usuarios set role = 'super_admin'
-- where id = (select id from auth.users where email = 'seu-email@exemplo.com');
