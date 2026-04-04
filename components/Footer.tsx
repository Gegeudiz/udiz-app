"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-gray-300 mt-0">

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* LOGO */}
        <div>
          <h2 className="text-white text-xl font-bold mb-2">Udiz</h2>
          <p className="text-sm text-gray-400">
            Conectando você ao comércio local.
          </p>
        </div>

        {/* LINKS */}
        <div>
          <h3 className="text-white font-semibold mb-3">Links Rápidos</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-white">
                Início
              </Link>
            </li>
            <li>
              <Link href="/busca" className="hover:text-white">
                Buscar Produtos
              </Link>
            </li>
            <li>
              <Link href="/estoque/solicitar" className="hover:text-white">
                Cadastrar Loja no Udiz Estoque
              </Link>
            </li>
          </ul>
        </div>

        {/* Udiz Estoque */}
        <div>
          <h3 className="text-white font-semibold mb-3">Udiz Estoque</h3>
          <ul className="space-y-2 text-sm">
            <li>📍 Aumente suas vendas com o Udiz Estoque</li>
            <li>📲 Sua Loja é fisica, mas alcança pessoas Online!</li>
            <li>🚀 Apareça para Milhares de Usuários</li>
            <li>❤️ Apoio ao comércio local</li>
          </ul>
        </div>

      </div>

      {/* LINHA FINAL */}
      <div className="border-t border-gray-700 text-center py-4 text-sm text-gray-400">
        © 2025 Udiz. Todos os direitos reservados.
      </div>

    </footer>
  );
}