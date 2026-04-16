"use client";

import { useEffect, useState } from "react";
import { resolveBrowserPublicOrigin } from "@/lib/appUrl";

/**
 * Origem pública do app no cliente (alinhada a links de auth / recuperação de senha).
 * Só fica disponível após o mount (evita mismatch de hidratação).
 */
export function usePublicAppBaseUrl(): string {
  const [base, setBase] = useState("");
  useEffect(() => {
    setBase(resolveBrowserPublicOrigin());
  }, []);
  return base;
}
