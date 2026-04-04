"use client";

import { useEffect, useState } from "react";

/**
 * Origem pública do app no cliente: NEXT_PUBLIC_APP_URL ou window.location.origin.
 * Só fica disponível após o mount (evita mismatch de hidratação).
 */
export function usePublicAppBaseUrl(): string {
  const [base, setBase] = useState("");
  useEffect(() => {
    const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const origin = env || (typeof window !== "undefined" ? window.location.origin : "");
    setBase(origin.replace(/\/+$/, ""));
  }, []);
  return base;
}
