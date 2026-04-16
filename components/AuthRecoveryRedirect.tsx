"use client";

import { useLayoutEffect } from "react";

const HASH_AUTH_TYPES = new Set(["recovery", "signup", "email"]);

/**
 * Se o link de auth cair na raiz (`/#access_token=…&type=…`) em vez de `/auth/callback`, envia para
 * `/auth/callback` antes de outro efeito tratar a URL. Com `detectSessionInUrl: false`, a sessão só
 * é aplicada na página de callback.
 */
export default function AuthRecoveryRedirect() {
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const { pathname, hash } = window.location;
    if (pathname === "/auth/callback") return;
    if (!hash || hash.length < 2) return;
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const type = params.get("type");
    if (!type || !HASH_AUTH_TYPES.has(type)) return;
    if (!params.get("access_token") || !params.get("refresh_token")) return;
    window.location.replace(`/auth/callback${hash}`);
  }, []);
  return null;
}
