import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const locale = request.nextUrl.pathname === "/en" || request.nextUrl.pathname.startsWith("/en/")
    ? "en"
    : "pt-BR"

  requestHeaders.set("x-proxy-locale", locale)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const proxyConfig = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
