"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Menu, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLiteMode } from "@/components/lite-mode-toggle";

export function Navbar() {
  const { data: session } = useSession();
  const { enabled, toggle } = useLiteMode();
  const role = session?.user?.role;

  const navLinks = [
    { href: "/requests", label: "Requests", roles: ["RESIDENT", "BUSINESS", "DRIVER", "ADMIN"] },
    { href: "/events", label: "Restock days", roles: ["RESIDENT", "BUSINESS", "DRIVER", "ADMIN"] },
    { href: "/shop", label: "Shop", roles: ["BUSINESS"] },
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
          <details className="relative md:hidden">
            <summary className="list-none">
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
              <div className="flex flex-col gap-3">
                {navLinks
                  .filter((link) => !link.roles || (role && link.roles.includes(role)))
                  .map((link) => (
                    <Link key={link.href} href={link.href} className="text-sm text-slate-700">
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
          </details>
        </div>
      </div>
    </header>
  );
}
