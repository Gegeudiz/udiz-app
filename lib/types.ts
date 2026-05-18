/**
 * Contratos alinhados ao localStorage (migração futura: Supabase).
 */

export type Loja = {
  id: string;
  uuid?: string;
  created_at?: string;
  updated_at?: string;
  nome: string;
  descricao: string;
  /** Linha completa para Google Maps (montada a partir dos campos abaixo quando possível). */
  endereco: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  /** Ex.: número da casa ou "S/N". */
  numero: string;
  complemento: string;
  whatsapp: string;
  imagem: string | null;
  /** Dono da loja (usuário logado no mock). */
  ownerId?: string;
};

export type Produto = {
  id: string;
  uuid?: string;
  created_at?: string;
  updated_at?: string;
  nome: string;
  preco: number;
  categoria: string;
  loja_id: string;
  descricao: string;
  imagem: string | null;
  /** Exibir na seção "Produtos em Destaque" da home (cidade da loja). */
  em_destaque?: boolean;
};

export type Usuario = {
  id: string;
  created_at?: string;
  updated_at?: string;
  nome: string;
  role?: "user" | "admin" | "super_admin";
  /** Data URL ou URL da foto de perfil (localStorage). */
  foto?: string | null;
  /** Frase curta opcional no perfil. */
  bio?: string;
};
