import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Quem acessa /admin/transferencia-lojas sem ?acao=transferir (login antigo, favorito)
 * vai para o painel novo em /admin.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/admin/transferencia-lojas" && searchParams.get("acao") !== "transferir") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/transferencia-lojas"],
};
