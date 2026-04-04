"use client";

type Props = {
  aberto: boolean;
  titulo: string;
  descricao: string;
  onCancelar: () => void;
  onConfirmar: () => void;
  carregando?: boolean;
  rotuloConfirmar?: string;
};

export default function ConfirmarExclusaoModal({
  aberto,
  titulo,
  descricao,
  onCancelar,
  onConfirmar,
  carregando = false,
  rotuloConfirmar = "Sim, excluir",
}: Props) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="udiz-confirmar-exclusao-titulo"
        className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200"
      >
        <h3 id="udiz-confirmar-exclusao-titulo" className="text-lg font-bold text-gray-900">
          {titulo}
        </h3>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{descricao}</p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onCancelar}
            disabled={carregando}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={carregando}
            className="px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {carregando ? "Excluindo…" : rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
