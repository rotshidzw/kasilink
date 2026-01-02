"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useLiteMode } from "@/components/lite-mode-toggle";

export function Navbar() {
  const { data: session } = useSession();
  const { enabled, toggle } = useLiteMode();
  const role = session?.user?.role;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const appShellRoutes = [
    "/dashboard",
    "/requests",
    "/drivers",
    "/events",
    "/business",
    "/driver",
    "/admin",
    "/shop",
    "/callcenter"
  ];

  if (appShellRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", roles: ["RESIDENT", "BUSINESS", "DRIVER", "ADMIN"] },
    { href: "/requests", label: "Requests", roles: ["RESIDENT", "BUSINESS", "DRIVER", "ADMIN"] },
    { href: "/drivers", label: "Drivers", roles: ["RESIDENT", "BUSINESS", "ADMIN"] },
    { href: "/events", label: "Events", roles: ["RESIDENT", "BUSINESS", "DRIVER", "ADMIN"] },
    { href: "/business", label: "Business", roles: ["BUSINESS", "ADMIN"] },
    { href: "/business/products", label: "Products", roles: ["BUSINESS"] },
    { href: "/driver", label: "Driver", roles: ["DRIVER"] },
    { href: "/admin", label: "Admin", roles: ["ADMIN"] }
  ];

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          KasiLink
        </Link>
        <nav className="hidden items-center gap-4 md:flex">
          {navLinks
            .filter((link) => !link.roles || (role && link.roles.includes(role)))
            .map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-slate-600 hover:text-slate-900">
                {link.label}
              </Link>
            ))}
        </nav>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <div className="hidden items-center gap-3 md:flex">
              <div className="text-sm text-slate-600">{session.user.email}</div>
              <Button variant="outline" size="sm" onClick={toggle}>
                Lite mode: {enabled ? "On" : "Off"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              Sign in
            </Link>
          )}
          <Button variant="outline" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 md:hidden">
          <div className="fixed inset-x-0 top-0 m-3 rounded-3xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Menu</div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {navLinks
                .filter((link) => !link.roles || (role && link.roles.includes(role)))
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-slate-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              {session?.user && (
                <>
                  <button type="button" className="text-left text-sm text-slate-700" onClick={toggle}>
                    Lite mode: {enabled ? "On" : "Off"}
                  </button>
                  <button type="button" className="text-left text-sm text-slate-700" onClick={() => signOut()}>
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
