import { z } from "zod";

export const usuarioSchema = z.object({
  id: z.string().min(1),
  nome: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(80),
  foto: z.string().nullable().optional(),
  bio: z.string().max(200).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const lojaSchema = z.object({
  id: z.string().min(1),
  uuid: z.string().optional(),
  nome: z.string().trim().min(2).max(80),
  descricao: z.string().trim().max(300),
  endereco: z.string().trim().min(4).max(140),
  whatsapp: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^[+()\-\s\d]+$/, "WhatsApp inválido"),
  imagem: z.string().nullable(),
  ownerId: z.string().min(1),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const produtoSchema = z.object({
  id: z.string().min(1),
  uuid: z.string().optional(),
  nome: z.string().trim().min(2).max(100),
  preco: z.number().min(0),
  categoria: z.string().trim().min(2).max(40),
  loja_id: z.string().min(1),
  descricao: z.string().trim().max(400),
  imagem: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  payload: unknown,
  fallbackMessage: string
): ValidationResult<T> {
  const parsed = schema.safeParse(payload);
  if (parsed.success) return { ok: true, data: parsed.data };
  const msg = parsed.error.issues[0]?.message ?? fallbackMessage;
  return { ok: false, message: msg };
}

