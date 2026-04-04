-- Campos de endereço estruturados; `endereco` continua sendo a linha completa para Google Maps e legado.

alter table public.lojas
  add column if not exists cidade text not null default '',
  add column if not exists bairro text not null default '',
  add column if not exists logradouro text not null default '',
  add column if not exists numero text not null default '',
  add column if not exists complemento text not null default '';

comment on column public.lojas.endereco is
  'Endereço em uma linha para busca no Google Maps; pode ser montado a partir de logradouro, número, etc.';
