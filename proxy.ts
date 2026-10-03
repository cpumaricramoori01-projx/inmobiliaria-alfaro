import { NextRequest, NextResponse } from "next/server";

// An early redirect improves navigation; layouts and API handlers verify the
// actual session in the database before exposing data or accepting mutations.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/login" || path === "/apple-icon.png" || path.startsWith("/api/auth/")) return NextResponse.next();
  if (!request.cookies.get("aa_session")?.value) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|branding/|favicon.ico|.*\\.svg$).*)"],
};
