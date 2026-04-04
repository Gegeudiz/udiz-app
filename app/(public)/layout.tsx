"use client";

import { CatalogProvider } from "@/contexts/CatalogContext";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <CatalogProvider>{children}</CatalogProvider>;
}
