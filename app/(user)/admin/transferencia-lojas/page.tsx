"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminTransferenciaForm from "@/components/admin/AdminTransferenciaForm";

function TransferenciaLojasContent() {
  const searchParams = useSearchParams();
  const acao = searchParams.get("acao");

  if (acao === "transferir") {
    return <AdminTransferenciaForm />;
  }

  return <AdminDashboard />;
}

export default function TransferenciaLojasAdminPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-purple-50 to-gray-100 px-4 py-12">
          <section className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600 shadow-sm">
            Carregando painel administrativo...
          </section>
        </main>
      }
    >
      <TransferenciaLojasContent />
    </Suspense>
  );
}
