# Regras de autorização para migração Supabase (RLS)

## Objetivo
Garantir isolamento por usuário e edição apenas pelo dono antes da migração para banco remoto.

## Regras implementadas no front
- Usuário só pode editar lojas onde `loja.ownerId === usuario.id`.
- Usuário só pode editar produto da própria loja.
- Favoritos ficam isolados por `userId`.

## Regras RLS sugeridas no Supabase
- **lojas**
  - SELECT: público (catálogo aberto)
  - INSERT/UPDATE/DELETE: apenas `auth.uid() = owner_id`
- **produtos**
  - SELECT: público
  - INSERT/UPDATE/DELETE: apenas quando `exists loja owner_id = auth.uid()`
- **favoritos**
  - SELECT/INSERT/DELETE: apenas linhas com `user_id = auth.uid()`
- **usuarios/perfis**
  - SELECT/UPDATE: apenas `id = auth.uid()`

## Campos mínimos esperados para migração
- `id` (uuid)
- `created_at` (timestamp)
- `updated_at` (timestamp)

