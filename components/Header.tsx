"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { encerrarSessaoApp } from "@/lib/auth/logout";
import { ESTOQUE_DESTINO_POS_LOGIN_KEY, PENDING_ESTOQUE_KEY } from "@/lib/usuario";
import type { Usuario } from "@/lib/types";

type HeaderProps = {
  usuario?: Usuario | null;
  abrirLogin?: () => void;
  onLogout?: () => void;
};

export default function Header({ usuario, abrirLogin, onLogout }: HeaderProps) {
  const router = useRouter();
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);

  const irUdizEstoque = () => {
    if (usuario) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(PENDING_ESTOQUE_KEY);
        sessionStorage.removeItem(ESTOQUE_DESTINO_POS_LOGIN_KEY);
      }
      router.push("/estoque/solicitar");
      return;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem(PENDING_ESTOQUE_KEY, "1");
      sessionStorage.setItem(ESTOQUE_DESTINO_POS_LOGIN_KEY, "/estoque/solicitar");
    }
    abrirLogin?.();
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md border-b border-gray-200 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center gap-3 md:gap-4">
        <Link href="/" className="shrink-0 min-w-0 self-center">
          <Image
            src="/logo.png"
            alt="Logo Udiz"
            width={140}
            height={80}
            className="object-contain md:w-[150px]"
          />
        </Link>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button
            type="button"
            onClick={irUdizEstoque}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-3 py-2 md:px-4 rounded-lg text-xs md:text-sm shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            Udiz Estoque
          </button>

          {usuario ? (
            <div className="relative flex flex-col items-end justify-center">
              <button
                type="button"
                onClick={() => setMenuPerfilAberto(!menuPerfilAberto)}
                className="flex flex-col items-end gap-1 md:flex-row md:items-center md:gap-2 rounded-lg px-1 py-1 hover:bg-gray-100 transition-colors text-right"
                aria-expanded={menuPerfilAberto}
                aria-haspopup="true"
              >
                {usuario.foto ? (
                  <img
                    src={usuario.foto}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200"
                  />
                ) : (
                  <div className="w-9 h-9 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {usuario.nome?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <span className="text-xs md:text-sm font-medium text-gray-900 max-w-[7.5rem] sm:max-w-[9rem] leading-tight break-words hyphens-auto md:max-w-[14rem] md:truncate md:break-normal md:hyphens-none text-right md:text-left">
                  {usuario.nome}
                </span>
              </button>

              {menuPerfilAberto && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Fechar menu"
                    onClick={() => setMenuPerfilAberto(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 shadow-lg rounded-lg py-1 z-50">
                    <button
                      type="button"
                      onClick={() => {
                        router.push("/perfil");
                        setMenuPerfilAberto(false);
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
                    >
                      Meu perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void encerrarSessaoApp().then(() => {
                          onLogout?.();
                          setMenuPerfilAberto(false);
                        });
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={abrirLogin}
              className="text-sm font-semibold text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border border-gray-300 transition-colors"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
