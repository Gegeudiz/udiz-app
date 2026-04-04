import { z } from "zod";

export const usuarioSchema = z.object({
  id: z.string().min(1, "Identificador do usuário inválido."),
  nome: z
    .string()
    .trim()
    .min(2, "O nome deve ter ao menos 2 caracteres.")
    .max(80, "O nome pode ter no máximo 80 caracteres."),
  foto: z.string().nullable().optional(),
  bio: z.string().max(200, "A bio pode ter no máximo 200 caracteres.").optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const lojaSchema = z.object({
  id: z.string().min(1, "Identificador da loja inválido."),
  uuid: z.string().optional(),
  nome: z
    .string()
    .trim()
    .min(2, "O nome da loja deve ter ao menos 2 caracteres.")
    .max(80, "O nome da loja pode ter no máximo 80 caracteres."),
  descricao: z.string().trim().max(300, "A descrição pode ter no máximo 300 caracteres."),
  cidade: z.string().trim().max(80, "Cidade pode ter no máximo 80 caracteres."),
  bairro: z.string().trim().max(80, "Bairro pode ter no máximo 80 caracteres."),
  logradouro: z.string().trim().max(120, "Rua/avenida pode ter no máximo 120 caracteres."),
  numero: z.string().trim().max(20, "Número pode ter no máximo 20 caracteres."),
  complemento: z.string().trim().max(80, "Complemento pode ter no máximo 80 caracteres."),
  endereco: z
    .string()
    .trim()
    .min(4, "O endereço completo deve ter ao menos 4 caracteres.")
    .max(320, "O endereço completo pode ter no máximo 320 caracteres."),
  whatsapp: z
    .string()
    .trim()
    .min(8, "Informe o WhatsApp com DDD (mínimo de 8 dígitos).")
    .max(20, "O WhatsApp pode ter no máximo 20 caracteres.")
    .regex(/^[+()\-\s\d]+$/, "Use apenas números, espaços, +, ( ) e hífen no WhatsApp."),
  imagem: z.string().nullable(),
  ownerId: z.string().min(1, "Dono da loja inválido."),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const produtoSchema = z.object({
  id: z.string().min(1, "Identificador do produto inválido."),
  uuid: z.string().optional(),
  nome: z
    .string()
    .trim()
    .min(2, "O nome do produto deve ter ao menos 2 caracteres.")
    .max(100, "O nome do produto pode ter no máximo 100 caracteres."),
  preco: z.number().min(0, "O preço não pode ser negativo."),
  categoria: z
    .string()
    .trim()
    .min(2, "Selecione ou informe uma categoria (ao menos 2 caracteres).")
    .max(40, "A categoria pode ter no máximo 40 caracteres."),
  loja_id: z.string().min(1, "Loja inválida."),
  descricao: z.string().trim().max(400, "A descrição pode ter no máximo 400 caracteres."),
  imagem: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

/** Mensagem amigável quando o Zod ainda devolve texto em inglês (ex.: versões futuras). */
function humanizarMensagemZod(message: string, fallback: string): string {
  const m = message.trim();
  if (/^too small:/i.test(m)) {
    const n = m.match(/>=\s*(\d+)/i);
    if (n) return `Informe ao menos ${n[1]} caracteres neste campo.`;
  }
  if (/^too big:/i.test(m)) {
    const n = m.match(/<=\s*(\d+)/i);
    if (n) return `Este campo pode ter no máximo ${n[1]} caracteres.`;
  }
  if (/invalid/i.test(m) && /email/i.test(m)) return "Email inválido.";
  return m || fallback;
}

export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  payload: unknown,
  fallbackMessage: string
): ValidationResult<T> {
  const parsed = schema.safeParse(payload);
  if (parsed.success) return { ok: true, data: parsed.data };
  const raw = parsed.error.issues[0]?.message ?? "";
  return { ok: false, message: humanizarMensagemZod(raw, fallbackMessage) };
}

