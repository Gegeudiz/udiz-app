"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectVendas() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/estoque");
  }, [router]);
  return <p className="py-6 text-gray-600">Redirecionando...</p>;
}
