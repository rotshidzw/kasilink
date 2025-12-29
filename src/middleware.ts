import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as string | undefined;
    const pathname = req.nextUrl.pathname;

    const roleGate = (allowed: string[]) => role && allowed.includes(role);

    if (pathname.startsWith("/admin") && !roleGate(["ADMIN"])) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/shop") && !roleGate(["BUSINESS", "RESIDENT", "ADMIN"])) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/business") && !roleGate(["BUSINESS", "ADMIN"])) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/driver") && !roleGate(["DRIVER"])) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/requests/new") && !roleGate(["RESIDENT"])) {
      return NextResponse.redirect(new URL("/requests", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: [
    "/requests/:path*",
    "/events/:path*",
    "/shop/:path*",
    "/business/:path*",
    "/driver/:path*",
    "/admin/:path*"
  ]
};
