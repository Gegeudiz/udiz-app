"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import Hero from "../../components/Hero";
import Destaques from "../../components/Destaques";
import BottomNav from "../../components/BottomNav";
import BannerLoja from "../../components/BannerLoja";
import Footer from "../../components/Footer";
import ModalLogin from "../../components/ModalLogin";
import type { Usuario } from "@/lib/types";
import {
  ESTOQUE_DESTINO_POS_LOGIN_KEY,
  PENDING_ESTOQUE_KEY,
  readUsuario,
  refreshUsuarioFromSupabaseSession,
} from "@/lib/usuario";

export default function Home() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [abrirLogin, setAbrirLogin] = useState(false);

  useEffect(() => {
    void refreshUsuarioFromSupabaseSession().then(() => setUsuario(readUsuario()));
  }, []);

  useEffect(() => {
    const onPerfil = () => {
      void refreshUsuarioFromSupabaseSession().then(() => setUsuario(readUsuario()));
    };
    window.addEventListener("udiz:usuario-atualizado", onPerfil);
    return () => window.removeEventListener("udiz:usuario-atualizado", onPerfil);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("estoque") === "1") {
      setAbrirLogin(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    if (!usuario || typeof window === "undefined") return;
    const pending = sessionStorage.getItem(PENDING_ESTOQUE_KEY);
    if (pending === "1") {
      sessionStorage.removeItem(PENDING_ESTOQUE_KEY);
      const dest =
        sessionStorage.getItem(ESTOQUE_DESTINO_POS_LOGIN_KEY) ?? "/estoque/solicitar";
      sessionStorage.removeItem(ESTOQUE_DESTINO_POS_LOGIN_KEY);
      router.push(dest.startsWith("/estoque") ? dest : "/estoque/solicitar");
    }
  }, [usuario, router]);

  return (
    <>
      <Header
        usuario={usuario}
        abrirLogin={() => setAbrirLogin(true)}
        onLogout={() => setUsuario(null)}
      />

      <main className="pt-20 md:pt-24 pb-24 md:pb-0 bg-gray-100 min-h-screen">
        <Hero />
        <Destaques usuario={usuario} onPrecisaLogin={() => setAbrirLogin(true)} />
        <BottomNav />
        <BannerLoja usuario={usuario} onPrecisaLogin={() => setAbrirLogin(true)} />
        <Footer />
      </main>

      <ModalLogin
        aberto={abrirLogin}
        fechar={() => setAbrirLogin(false)}
        onLogin={(user) => setUsuario(user)}
      />
    </>
  );
}
