"use client";

import { useRouter } from "next/navigation";
import type { Usuario } from "@/lib/types";
import { PENDING_ESTOQUE_KEY } from "@/lib/usuario";

type Props = {
  usuario: Usuario | null;
  onPrecisaLogin: () => void;
};

export default function BannerLoja({ usuario, onPrecisaLogin }: Props) {
  const router = useRouter();

  const irParaEstoque = () => {
    if (usuario) {
      router.push("/estoque");
      return;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem(PENDING_ESTOQUE_KEY, "1");
    }
    onPrecisaLogin();
  };

  return (
    <section className="bg-white py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              Tem uma loja? Junte-se a nós no Udiz Estoque!
            </h2>

            <p className="text-sm text-purple-200">
              Cadastre sua loja gratuitamente e alcance mais clientes na sua região.
              Aumente suas vendas com o Udiz!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={irParaEstoque}
              className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg font-semibold"
            >
              Cadastrar no Udiz Estoque
            </button>

            <button
              type="button"
              className="bg-white text-purple-800 px-4 py-2 rounded-lg font-semibold"
            >
              Falar com Especialista
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
