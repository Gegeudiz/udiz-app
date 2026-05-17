"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminGate, hasAdminGate } from "@/lib/admin/adminGate";
import { isAdminUser } from "@/lib/authz";
import type { Usuario } from "@/lib/types";
import { readUsuario, refreshUsuarioFromSupabaseSession } from "@/lib/usuario";

const ADMIN_ENTRAR_PATH = "/admin/entrar";

export function useAdminAuth() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshUsuarioFromSupabaseSession();
      if (cancelled) return;
      const current = readUsuario();
      const adminOk = isAdminUser(current) && hasAdminGate();
      setUsuario(current);
      setAutorizado(adminOk);
      setLoadingAuth(false);
      if (!adminOk) {
        clearAdminGate();
        router.replace(ADMIN_ENTRAR_PATH);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return {
    usuario,
    loadingAuth,
    isAdmin: autorizado,
  };
}
