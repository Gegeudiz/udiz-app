"use client";

import { useState } from "react";

type SecaoPolitica = {
  titulo: string;
  conteudo: string[];
};

const SECOES_POLITICA: SecaoPolitica[] = [
  {
    titulo: "1. Cultura Udiz (Por que o Udiz existe?)",
    conteudo: [
      "O Udiz foi criado para conectar pessoas! Estamos conectando pessoas que procuram um produto específico a lojas que vendem esses produtos na sua cidade, próximo de você e agora.",
      "Nosso foco é facilitar a descoberta rápida de produtos e ajudar o cliente a tomar decisão com base em proximidade, preço, marca e disponibilidade imediata.",
      "O Udiz não substitui a loja, ele leva clientes até ela.",
      "Quanto mais completo e fiel for o catálogo do lojista, maior será a chance de venda.",
    ],
  },
  {
    titulo: "2. Boas Práticas (Como se destacar e vender mais)",
    conteudo: [
      "Produtos bem cadastrados: use nomes claros (ex: Furadeira Bosch 500W) e evite nomes genéricos.",
      "Preço visível: produtos com preço recebem mais cliques e mais contatos; clientes confiam mais quando já sabem o valor.",
      "Fotos de boa qualidade: prefira fotos próprias da loja e, se usar imagem da internet, que seja fiel ao produto.",
      "Atualização constante: mantenha preços atualizados e remova produtos indisponíveis.",
    ],
  },
  {
    titulo: "3. Regras e Proibições (O que não pode no Udiz)",
    conteudo: [
      "Não é permitido anunciar produtos ilegais (drogas, armas, explosivos, medicamentos irregulares e itens proibidos pela legislação).",
      "O Udiz não atua no segmento alimentício: marmitas, lanches, produtos de mercado, doces e bebidas não são permitidos.",
      "Não é permitido anunciar animais (domésticos ou silvestres) nem vestuário (roupas, calçados e acessórios de moda).",
      "Penalidades: remoção dos produtos, suspensão da conta e exclusão permanente da plataforma.",
    ],
  },
  {
    titulo: "4. Principais Dúvidas",
    conteudo: [
      "Preciso colocar o preço? Sim. Os produtos estão disponíveis para comparação e o preço aumenta conversão.",
      "O Udiz vende por mim? Não. O Udiz conecta o cliente até sua loja; a venda acontece diretamente com você.",
      "Preciso atualizar os produtos? Sim. Produtos desatualizados ou com preço incorreto reduzem confiança e vendas.",
      "O Udiz se responsabiliza pela venda? Não. O Udiz é um intermediador digital entre cliente e lojista.",
      "Posso cadastrar qualquer produto? Não. É necessário seguir as regras da plataforma e a política interna do Udiz.",
    ],
  },
];

export default function PoliticaUdizAccordion() {
  const [secaoAberta, setSecaoAberta] = useState<number | null>(0);

  return (
    <article className="rounded-xl border border-violet-500/60 bg-gradient-to-br from-violet-800 via-purple-800 to-indigo-800 p-5 shadow-sm">
      <h2 className="text-lg font-bold text-white">Política Udiz</h2>
      <p className="mt-1 mb-4 text-sm leading-relaxed text-violet-100">
        Usuários e lojistas que seguem essas práticas contribuem para uma boa performance e
        desempenho da plataforma Udiz, aprimorando a experiência de todos os usuários.
      </p>

      <div className="space-y-3">
        {SECOES_POLITICA.map((secao, idx) => {
          const aberta = secaoAberta === idx;
          return (
            <section key={secao.titulo} className="rounded-xl border border-violet-300/40 bg-transparent">
              <button
                type="button"
                onClick={() => setSecaoAberta(aberta ? null : idx)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-4 text-left transition-all duration-300 hover:bg-white/10"
                aria-expanded={aberta}
              >
                <span className="text-sm font-semibold leading-relaxed text-white">{secao.titulo}</span>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 text-violet-100/90 transition-transform duration-300 ${
                    aberta ? "rotate-180" : "rotate-0"
                  }`}
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div
                className={`grid transition-all duration-300 ease-out ${
                  aberta ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-70"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 pt-1">
                    <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
                      {secao.conteudo.map((linha) => (
                        <li key={linha} className="rounded-lg bg-white p-3">
                          {linha}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}
