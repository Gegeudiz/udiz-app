import { describe, expect, it, beforeEach } from "vitest";
import { getSalvosIds, toggleProdutoSalvo } from "@/lib/favoritos";
import { readUsuario, writeUsuario } from "@/lib/usuario";

describe("favoritos e usuario helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("salva e remove favoritos por usuário", () => {
    expect(getSalvosIds("u1")).toEqual([]);
    expect(toggleProdutoSalvo("u1", "10")).toBe(true);
    expect(getSalvosIds("u1")).toEqual(["10"]);
    expect(toggleProdutoSalvo("u1", "10")).toBe(false);
    expect(getSalvosIds("u1")).toEqual([]);
  });

  it("persiste e lê usuário com campos extras", () => {
    writeUsuario({ id: "u1", nome: "Maria", bio: "Compradora" });
    const user = readUsuario();
    expect(user).not.toBeNull();
    expect(user?.id).toBe("u1");
    expect(user?.nome).toBe("Maria");
    expect(user?.bio).toBe("Compradora");
  });
});

