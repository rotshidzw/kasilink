"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Menu, Sparkles, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserCircle2 className="h-4 w-4" />
                  {session.user.name ?? session.user.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="space-y-1">
                  <div className="text-xs text-slate-500">Signed in as</div>
                  <div className="text-sm font-medium text-slate-900">{session.user.email}</div>
                  {role && <Badge variant="secondary">{role}</Badge>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={enabled} onCheckedChange={toggle}>
                  Lite mode (low data)
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              Sign in
            </Link>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-6">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3">
                {navLinks
                  .filter((link) => !link.roles || (role && link.roles.includes(role)))
                  .map((link) => (
                    <Link key={link.href} href={link.href} className="text-sm text-slate-700">
                      {link.label}
                    </Link>
                  ))}
              </div>
              <div className="mt-auto text-xs text-slate-500">
                Lite mode: {enabled ? "On" : "Off"}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
