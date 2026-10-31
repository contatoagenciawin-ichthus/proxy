import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const institutionalHost = "proxyone.tech"
const appHost = "app.proxyone.tech"

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase()
  const pathname = request.nextUrl.pathname

  // Keep the public company site and the operational platform separated by hostname.
  // Meta-facing legal endpoints intentionally remain available on app.proxyone.tech.
  if (
    host === institutionalHost &&
    (pathname.startsWith("/meta") || pathname.startsWith("/api/meta"))
  ) {
    const url = request.nextUrl.clone()
    url.hostname = appHost
    url.port = ""
    url.protocol = "https:"
    return NextResponse.redirect(url, 308)
  }

  const requestHeaders = new Headers(request.headers)
  const locale = pathname === "/en" || pathname.startsWith("/en/")
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
