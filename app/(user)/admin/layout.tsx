import { CatalogProvider } from "@/contexts/CatalogContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <CatalogProvider>{children}</CatalogProvider>;
}
