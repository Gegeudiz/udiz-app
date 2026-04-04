# Contrato de dados: Cursor ↔ Supabase

Nomes no **Postgres** em `snake_case`. O front pode continuar com os tipos TypeScript atuais; o adapter faz o mapeamento.

## Tabelas

| Supabase (`public`) | Uso no app |
|---------------------|------------|
| `usuarios` | Perfil (nome, foto, bio). `id` = `auth.users.id` (UUID). |
| `lojas` | Lojas do Udiz Estoque. `owner_id` → dono. |
| `produtos` | Catálogo. `loja_id` → loja. |
| `favoritos` | Salvos por usuário. Único (`user_id`, `produto_id`). |
| `eventos` | Telemetria opcional (event + payload JSON). |

## Campos principais (resumo)

### `public.usuarios`
- `id` uuid PK, FK `auth.users(id)`
- `nome` text NOT NULL
- `foto` text NULL
- `bio` text
- `created_at`, `updated_at` timestamptz

### `public.lojas`
- `id` uuid PK default `gen_random_uuid()`
- `owner_id` uuid NOT NULL → `auth.users(id)`
- `nome`, `descricao`, `endereco`, `whatsapp` text
- `imagem` text NULL
- `created_at`, `updated_at`

### `public.produtos`
- `id` uuid PK
- `loja_id` uuid NOT NULL → `public.lojas(id)`
- `nome`, `categoria`, `descricao` text
- `preco` numeric(12,2) ≥ 0
- `imagem` text NULL
- `created_at`, `updated_at`

### `public.favoritos`
- `id` uuid PK
- `user_id` uuid NOT NULL → `auth.users(id)`
- `produto_id` uuid NOT NULL → `public.produtos(id)`
- UNIQUE(`user_id`, `produto_id`)

### `public.eventos`
- `id` bigserial PK
- `user_id` uuid NULL
- `event` text NOT NULL
- `payload` jsonb NULL
- `created_at` timestamptz

## Legado local (hoje)

- `Loja.id` / `Produto.id` são **number** no `localStorage`.
- Após migração completa, no app passam a ser **UUID** (string) ou um campo `public_id` — definir no adapter na Fase 5.

## RLS (resumo)

- Catálogo (`lojas`, `produtos`): **SELECT** liberado para leitura pública (anon).
- Escrita: apenas dono da loja / usuário autenticado conforme políticas no SQL.
- `favoritos` / `usuarios`: apenas o próprio `auth.uid()`.
