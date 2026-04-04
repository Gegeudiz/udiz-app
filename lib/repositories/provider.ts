/**
 * Fonte de dados da aplicação (Fase 4 do plano Supabase).
 * Mantemos "local" até o adapter Supabase estar completo.
 */
export function getDataProvider(): "local" | "supabase" {
  const v = process.env.NEXT_PUBLIC_DATA_PROVIDER;
  if (v === "supabase") return "supabase";
  return "local";
}
