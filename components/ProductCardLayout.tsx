import type { ReactNode } from "react";

/** Grade alinhada à seção "Produtos em Destaque" (home). */
export const PRODUCT_CARD_GRID_CLASS =
  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4";

/** Card estático (ex.: painel da loja com botão Editar). */
export const PRODUCT_CARD_SURFACE_CLASS =
  "bg-white rounded-xl shadow-sm p-3 flex flex-col h-full min-w-0";

/** Card clicável (link). */
export const PRODUCT_CARD_SURFACE_INTERACTIVE_CLASS =
  "bg-white rounded-xl shadow-sm p-3 hover:shadow-md transition flex flex-col h-full min-w-0";

type ImgProps = { src: string | null | undefined; alt: string };

export function ProductCardImageArea({ src, alt }: ImgProps) {
  if (src) {
    return (
      <img src={src} alt={alt} className="w-full h-32 object-contain mb-2" />
    );
  }
  return (
    <div className="w-full h-32 mb-2 flex items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-400">
      Sem foto
    </div>
  );
}

export function ProductCardNome({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[40px]">
      {children}
    </h3>
  );
}

export function ProductCardPreco({ valor }: { valor: number }) {
  return (
    <p className="text-purple-600 font-bold text-sm">
      R$ {Number(valor).toFixed(2)}
    </p>
  );
}

export function ProductCardNomeLoja({ children }: { children: ReactNode }) {
  return <p className="text-xs text-gray-500">{children}</p>;
}
