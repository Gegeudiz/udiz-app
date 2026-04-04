import { expect, test } from "@playwright/test";

test("login e navegação para salvos", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByRole("button", { name: "Entrar na conta de demonstração" }).click();
  await page.goto("/salvos");
  await expect(page.getByRole("heading", { name: "Salvos" })).toBeVisible();
});

