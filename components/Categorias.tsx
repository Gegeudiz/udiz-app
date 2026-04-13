"use client";

import Link from "next/link";
import { CATEGORIAS_UDIZ } from "@/lib/categoriasUdiz";

export default function Categorias() {
  return (
    <div className="max-w-6xl mx-auto px-4 mt-6">
      <div className="flex flex-wrap gap-3 justify-center">
        {CATEGORIAS_UDIZ.map((categoria) => (
          <Link
            key={categoria}
            href={`/busca?categoria=${encodeURIComponent(categoria)}`}
            className="bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-100 hover:text-purple-700 transition"
          >
            {categoria}
          </Link>
        ))}
      </div>
    </div>
  );
}
