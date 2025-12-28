"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          KasiLink
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/requests" className="text-sm text-slate-600 hover:text-slate-900">
            Requests
          </Link>
          <Link href="/events" className="text-sm text-slate-600 hover:text-slate-900">
            Events
          </Link>
          {session?.user?.role && (
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
          )}
          {session?.user?.role === "ADMIN" && (
            <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">
              Admin
            </Link>
          )}
          {session?.user ? (
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
