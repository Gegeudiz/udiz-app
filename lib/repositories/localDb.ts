import { nowIso, newUuid } from "@/lib/ids";
import { lojaSchema, produtoSchema, usuarioSchema, validateSchema, type ValidationResult } from "@/lib/schemas/domain";
import type { Loja, Produto, Usuario } from "@/lib/types";

const KEYS = {
  usuario: "usuario",
  lojas: "lojas",
  produtos: "produtos",
  favoritos: "udiz_salvos",
} as const;

type FavoritosMap = Record<string, string[]>;

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function normalizeFavoritosMap(raw: unknown): { map: FavoritosMap; migrated: boolean } {
  if (!raw || typeof raw !== "object") return { map: {}, migrated: false };
  let migrated = false;
  const map: FavoritosMap = {};
  for (const [uid, ids] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(ids)) continue;
    const next = ids.map((x) => String(x));
    map[uid] = next;
    if (ids.some((x) => typeof x === "number")) migrated = true;
  }
  return { map, migrated };
}

function readFavoritosMap(): FavoritosMap {
  const raw = safeReadJson<unknown>(KEYS.favoritos, {});
  const { map, migrated } = normalizeFavoritosMap(raw);
  if (migrated) safeWriteJson(KEYS.favoritos, map);
  return map;
}

function hydrateLoja(item: Partial<Loja>): Loja | null {
  const now = nowIso();
  const idRaw = item.id != null ? String(item.id) : "";
  const candidate: Loja = {
    id: idRaw || newUuid(),
    uuid: item.uuid != null ? String(item.uuid) : idRaw || newUuid(),
    nome: String(item.nome ?? "").trim(),
    descricao: String(item.descricao ?? "").trim(),
    endereco: String(item.endereco ?? "").trim(),
    whatsapp: String(item.whatsapp ?? "").trim(),
    imagem: item.imagem ?? null,
    ownerId: String(item.ownerId ?? ""),
    created_at: item.created_at ?? now,
    updated_at: item.updated_at ?? now,
  };
  return lojaSchema.safeParse(candidate).success ? candidate : null;
}

function hydrateProduto(item: Partial<Produto>): Produto | null {
  const now = nowIso();
  const idRaw = item.id != null ? String(item.id) : "";
  const lojaIdRaw = item.loja_id != null ? String(item.loja_id) : "";
  const candidate: Produto = {
    id: idRaw || newUuid(),
    uuid: item.uuid != null ? String(item.uuid) : idRaw || newUuid(),
    nome: String(item.nome ?? "").trim(),
    preco: Number(item.preco ?? 0),
    categoria: String(item.categoria ?? "").trim(),
    loja_id: lojaIdRaw || "",
    descricao: String(item.descricao ?? "").trim(),
    imagem: item.imagem ?? null,
    created_at: item.created_at ?? now,
    updated_at: item.updated_at ?? now,
  };
  if (!candidate.loja_id) return null;
  return produtoSchema.safeParse(candidate).success ? candidate : null;
}

export const userRepo = {
  read(): Usuario | null {
    const raw = safeReadJson<Partial<Usuario> | null>(KEYS.usuario, null);
    if (!raw) return null;
    const now = nowIso();
    const candidate: Usuario = {
      id: String(raw.id ?? "").trim(),
      nome: String(raw.nome ?? "").trim(),
      foto: raw.foto ?? null,
      bio: typeof raw.bio === "string" ? raw.bio : "",
      created_at: raw.created_at ?? now,
      updated_at: raw.updated_at ?? now,
    };
    const parsed = usuarioSchema.safeParse(candidate);
    if (!parsed.success) return null;
    if (!raw.created_at || !raw.updated_at) safeWriteJson(KEYS.usuario, candidate);
    return candidate;
  },
  write(user: Usuario): ValidationResult<Usuario> {
    const parsed = validateSchema(usuarioSchema, { ...user, updated_at: nowIso() }, "Usuário inválido");
    if (!parsed.ok) return parsed;
    safeWriteJson(KEYS.usuario, parsed.data);
    return parsed;
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEYS.usuario);
  },
};

export const lojaRepo = {
  list(): Loja[] {
    const raw = safeReadJson<Partial<Loja>[]>(KEYS.lojas, []);
    const list = raw.map(hydrateLoja).filter((l): l is Loja => Boolean(l));
    safeWriteJson(KEYS.lojas, list);
    return list;
  },
  listByOwner(ownerId: string): Loja[] {
    return this.list().filter((l) => l.ownerId === ownerId);
  },
  findById(id: string): Loja | null {
    return this.list().find((l) => l.id === id) ?? null;
  },
  create(payload: Omit<Loja, "id" | "uuid" | "created_at" | "updated_at">): ValidationResult<Loja> {
    const list = this.list();
    const now = nowIso();
    const id = newUuid();
    const next: Loja = {
      ...payload,
      id,
      uuid: newUuid(),
      created_at: now,
      updated_at: now,
    };
    const parsed = validateSchema(lojaSchema, next, "Dados da loja inválidos");
    if (!parsed.ok) return parsed;
    list.push(parsed.data);
    safeWriteJson(KEYS.lojas, list);
    return parsed;
  },
  update(id: string, ownerId: string, changes: Partial<Loja>): ValidationResult<Loja> {
    const list = this.list();
    const idx = list.findIndex((l) => l.id === id);
    if (idx < 0) return { ok: false, message: "Loja não encontrada" };
    if (list[idx].ownerId !== ownerId) return { ok: false, message: "Sem permissão para editar esta loja" };
    const next = { ...list[idx], ...changes, id: list[idx].id, ownerId, updated_at: nowIso() };
    const parsed = validateSchema(lojaSchema, next, "Dados da loja inválidos");
    if (!parsed.ok) return parsed;
    list[idx] = parsed.data;
    safeWriteJson(KEYS.lojas, list);
    return parsed;
  },
  delete(id: string, ownerId: string): { ok: true } | { ok: false; message: string } {
    const list = this.list();
    const idx = list.findIndex((l) => l.id === id);
    if (idx < 0) return { ok: false, message: "Loja não encontrada." };
    if (list[idx].ownerId !== ownerId) {
      return { ok: false, message: "Somente quem criou a loja pode excluí-la." };
    }
    list.splice(idx, 1);
    safeWriteJson(KEYS.lojas, list);
    produtoRepo.removeAllFromLoja(id);
    return { ok: true };
  },
};

export const produtoRepo = {
  list(): Produto[] {
    const raw = safeReadJson<Partial<Produto>[]>(KEYS.produtos, []);
    const list = raw.map(hydrateProduto).filter((p): p is Produto => Boolean(p));
    safeWriteJson(KEYS.produtos, list);
    return list;
  },
  listByLoja(lojaId: string): Produto[] {
    return this.list().filter((p) => p.loja_id === lojaId);
  },
  findById(id: string): Produto | null {
    return this.list().find((p) => p.id === id) ?? null;
  },
  create(payload: Omit<Produto, "id" | "uuid" | "created_at" | "updated_at">): ValidationResult<Produto> {
    const list = this.list();
    const now = nowIso();
    const id = newUuid();
    const next: Produto = {
      ...payload,
      id,
      uuid: newUuid(),
      created_at: now,
      updated_at: now,
    };
    const parsed = validateSchema(produtoSchema, next, "Dados do produto inválidos");
    if (!parsed.ok) return parsed;
    list.push(parsed.data);
    safeWriteJson(KEYS.produtos, list);
    return parsed;
  },
  update(id: string, lojaId: string, changes: Partial<Produto>): ValidationResult<Produto> {
    const list = this.list();
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return { ok: false, message: "Produto não encontrado" };
    if (list[idx].loja_id !== lojaId) return { ok: false, message: "Produto não pertence à loja" };
    const next = { ...list[idx], ...changes, id: list[idx].id, loja_id: lojaId, updated_at: nowIso() };
    const parsed = validateSchema(produtoSchema, next, "Dados do produto inválidos");
    if (!parsed.ok) return parsed;
    list[idx] = parsed.data;
    safeWriteJson(KEYS.produtos, list);
    return parsed;
  },
  removeAllFromLoja(lojaId: string): void {
    const list = this.list().filter((p) => p.loja_id !== lojaId);
    safeWriteJson(KEYS.produtos, list);
  },
  delete(id: string, lojaId: string): { ok: true } | { ok: false; message: string } {
    const list = this.list();
    const idx = list.findIndex((p) => p.id === id && p.loja_id === lojaId);
    if (idx < 0) return { ok: false, message: "Produto não encontrado." };
    list.splice(idx, 1);
    safeWriteJson(KEYS.produtos, list);
    return { ok: true };
  },
};

export const favoritoRepo = {
  listByUser(userId: string): string[] {
    const map = readFavoritosMap();
    return map[userId] ?? [];
  },
  isSaved(userId: string, produtoId: string): boolean {
    return this.listByUser(userId).includes(produtoId);
  },
  toggle(userId: string, produtoId: string): boolean {
    const map = readFavoritosMap();
    const pid = String(produtoId);
    const current = [...(map[userId] ?? [])];
    const index = current.indexOf(pid);
    if (index >= 0) {
      current.splice(index, 1);
      map[userId] = current;
      safeWriteJson(KEYS.favoritos, map);
      return false;
    }
    map[userId] = [...current, pid];
    safeWriteJson(KEYS.favoritos, map);
    return true;
  },
};
