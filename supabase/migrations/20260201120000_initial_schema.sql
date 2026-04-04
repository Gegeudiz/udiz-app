-- Udiz — schema inicial + RLS
-- Rode no Supabase: SQL Editor → New query → colar → Run
-- Ou use: supabase db push (CLI), se configurar o projeto linkado

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- ---------------------------------------------------------------------------
create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  foto text,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Lojas e produtos (catálogo público leitura)
-- ---------------------------------------------------------------------------
create table public.lojas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  descricao text not null default '',
  endereco text not null,
  whatsapp text not null,
  imagem text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas (id) on delete cascade,
  nome text not null,
  preco numeric(12, 2) not null check (preco >= 0),
  categoria text not null,
  descricao text not null default '',
  imagem text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index produtos_loja_id_idx on public.produtos (loja_id);
create index produtos_categoria_idx on public.produtos (categoria);

-- ---------------------------------------------------------------------------
-- Favoritos
-- ---------------------------------------------------------------------------
create table public.favoritos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  produto_id uuid not null references public.produtos (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, produto_id)
);

create index favoritos_user_id_idx on public.favoritos (user_id);

-- ---------------------------------------------------------------------------
-- Telemetria (opcional)
-- ---------------------------------------------------------------------------
create table public.eventos (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  event text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger usuarios_set_updated_at
  before update on public.usuarios
  for each row execute function public.set_updated_at();

create trigger lojas_set_updated_at
  before update on public.lojas
  for each row execute function public.set_updated_at();

create trigger produtos_set_updated_at
  before update on public.produtos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.usuarios enable row level security;
alter table public.lojas enable row level security;
alter table public.produtos enable row level security;
alter table public.favoritos enable row level security;
alter table public.eventos enable row level security;

-- usuarios: só o próprio usuário
create policy "usuarios_select_own"
  on public.usuarios for select
  using (auth.uid() = id);

create policy "usuarios_update_own"
  on public.usuarios for update
  using (auth.uid() = id);

create policy "usuarios_insert_own"
  on public.usuarios for insert
  with check (auth.uid() = id);

-- lojas: leitura pública; escrita só dono
create policy "lojas_select_all"
  on public.lojas for select
  using (true);

create policy "lojas_insert_owner"
  on public.lojas for insert
  with check (auth.uid() = owner_id);

create policy "lojas_update_owner"
  on public.lojas for update
  using (auth.uid() = owner_id);

create policy "lojas_delete_owner"
  on public.lojas for delete
  using (auth.uid() = owner_id);

-- produtos: leitura pública; escrita só dono da loja
create policy "produtos_select_all"
  on public.produtos for select
  using (true);

create policy "produtos_insert_owner"
  on public.produtos for insert
  with check (
    exists (
      select 1 from public.lojas l
      where l.id = loja_id and l.owner_id = auth.uid()
    )
  );

create policy "produtos_update_owner"
  on public.produtos for update
  using (
    exists (
      select 1 from public.lojas l
      where l.id = loja_id and l.owner_id = auth.uid()
    )
  );

create policy "produtos_delete_owner"
  on public.produtos for delete
  using (
    exists (
      select 1 from public.lojas l
      where l.id = loja_id and l.owner_id = auth.uid()
    )
  );

-- favoritos: só o próprio usuário
create policy "favoritos_select_own"
  on public.favoritos for select
  using (auth.uid() = user_id);

create policy "favoritos_insert_own"
  on public.favoritos for insert
  with check (auth.uid() = user_id);

create policy "favoritos_delete_own"
  on public.favoritos for delete
  using (auth.uid() = user_id);

-- eventos: usuário autenticado pode registrar (ajuste depois se quiser só service role)
create policy "eventos_insert_authenticated"
  on public.eventos for insert
  with check (auth.uid() is not null);

create policy "eventos_select_own"
  on public.eventos for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Novo usuário em auth.users → linha em public.usuarios
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nome)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1), 'Usuário')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
