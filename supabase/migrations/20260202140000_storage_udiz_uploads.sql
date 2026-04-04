-- Bucket público para fotos de perfil, lojas e produtos (URLs salvas nas tabelas).
-- Caminho: {auth.uid()}/... — RLS garante que só o dono escreve na própria pasta.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'udiz-uploads',
  'udiz-uploads',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "udiz_uploads_select_public" on storage.objects;
create policy "udiz_uploads_select_public"
  on storage.objects for select
  using (bucket_id = 'udiz-uploads');

drop policy if exists "udiz_uploads_insert_own" on storage.objects;
create policy "udiz_uploads_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'udiz-uploads'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "udiz_uploads_update_own" on storage.objects;
create policy "udiz_uploads_update_own"
  on storage.objects for update
  using (
    bucket_id = 'udiz-uploads'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "udiz_uploads_delete_own" on storage.objects;
create policy "udiz_uploads_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'udiz-uploads'
    and split_part(name, '/', 1) = auth.uid()::text
  );
