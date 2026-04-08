"use client";

export default function Categorias() {
  const categorias = [
    "Brinquedos",
    "Escritório",
    "Escola",
    "Casa/Jardim",
    "Decoração",
    "Festas",
    "Pet",
    "Ferragista",
    "Eletrônicos",
    "Outros",
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 mt-6">
      <div className="flex flex-wrap gap-3 justify-center">
        {categorias.map((categoria) => (
          <button
            key={categoria}
            className="bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-100 hover:text-purple-700 transition"
          >
            {categoria}
          </button>
        ))}
      </div>
    </div>
  );
}