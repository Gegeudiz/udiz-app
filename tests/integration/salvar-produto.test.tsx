import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BotaoSalvarProduto from "@/components/BotaoSalvarProduto";

describe("BotaoSalvarProduto", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => cleanup());

  it("abre login quando não há usuário", () => {
    const onLogin = vi.fn();
    render(<BotaoSalvarProduto produtoId="1" usuario={null} onPrecisaLogin={onLogin} />);
    fireEvent.click(screen.getAllByRole("button", { name: /salvar produto/i })[0]);
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it("salva produto quando usuário está logado", () => {
    render(
      <BotaoSalvarProduto
        produtoId="11"
        usuario={{ id: "u1", nome: "Teste" }}
        onPrecisaLogin={() => undefined}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /salvar produto/i }));
    const map = JSON.parse(localStorage.getItem("udiz_salvos") ?? "{}");
    expect(map.u1).toEqual(["11"]);
  });
});

