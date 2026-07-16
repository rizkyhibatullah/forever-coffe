import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  const publicPaths = ["/", "/login", "/api/auth", "/api", "/_next"]
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/pos", req.url))
  }

  if (isLoggedIn && role === "kasir") {
    const ownerPaths = ["/dashboard", "/settings", "/products", "/categories"]
    const isOwnerPath = ownerPaths.some((p) => pathname.startsWith(p))
    if (isOwnerPath) {
      return NextResponse.redirect(new URL("/pos", req.url))
    }
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
