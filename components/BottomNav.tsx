"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const item = (href: string, icon: string, label: string) => {
    const ativo =
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={`flex flex-col items-center ${ativo ? "text-purple-600" : "text-gray-500"}`}
      >
        <span>{icon}</span>
        <span className="text-xs">{label}</span>
      </Link>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around items-center py-2 md:hidden z-40">
      {item("/", "🏠", "Início")}
      {item("/busca", "🔍", "Buscar")}
      {item("/salvos", "❤️", "Salvos")}
      {item("/perfil", "👤", "Perfil")}
    </div>
  );
}
