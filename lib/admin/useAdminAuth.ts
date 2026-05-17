"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminUser } from "@/lib/authz";
import type { Usuario } from "@/lib/types";
import { readUsuario, refreshUsuarioFromSupabaseSession } from "@/lib/usuario";

export function useAdminAuth() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshUsuarioFromSupabaseSession();
      if (cancelled) return;
      const current = readUsuario();
      setUsuario(current);
      setLoadingAuth(false);
      if (!isAdminUser(current)) {
        router.replace("/");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return {
    usuario,
    loadingAuth,
    isAdmin: isAdminUser(usuario),
  };
}
