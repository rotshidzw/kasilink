"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle, PhoneCall, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { usePreferences } from "@/components/preferences-provider";

type NavItem = { href: string; label: string };

type AppShellClientProps = {
  role: string;
  navItems: NavItem[];
  children: React.ReactNode;
};

const supportWhatsApp = "https://wa.me/27820000000";

export function AppShellClient({ role, navItems, children }: AppShellClientProps) {
  const pathname = usePathname();
  const { lowDataMode, largeText, language, setLanguage, setLowDataMode, setLargeText, t } = usePreferences();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const bottomNav = [
    { href: "/dashboard", label: t("home") },
    { href: "/requests", label: t("requests") },
    { href: supportWhatsApp, label: t("whatsapp"), external: true },
    { href: "/dashboard", label: t("account") }
  ];

  return (
    <div className="relative">
      <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">KasiLink</p>
            <p className="text-base font-semibold text-slate-900">{role} hub</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-700"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>
        <aside className="hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-400">Navigation</p>
            <p className="text-base font-semibold text-slate-900">{role} hub</p>
          </div>
          <nav className="mt-6 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "justify-start",
                  pathname === item.href && "bg-slate-100"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">WhatsApp support</p>
            <p className="mt-2">Chat with KasiLink support for assisted orders.</p>
            <Link
              href={supportWhatsApp}
              className={cn(buttonVariants({ size: "sm" }), "mt-3 w-full")}
              target="_blank"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Link>
          </div>
          <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">Settings</p>
            <label className="flex items-center justify-between text-sm text-slate-700">
              Low data
              <input
                type="checkbox"
                checked={lowDataMode}
                onChange={(event) => setLowDataMode(event.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between text-sm text-slate-700">
              Large text
              <input
                type="checkbox"
                checked={largeText}
                onChange={(event) => setLargeText(event.target.checked)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Language
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as "EN" | "ZU" | "ST" | "VE")}
                className="rounded-md border border-slate-200 px-2 py-1 text-sm"
              >
                <option value="EN">English</option>
                <option value="ZU">Zulu</option>
                <option value="ST">Sotho</option>
                <option value="VE">Venda</option>
              </select>
            </label>
          </div>
        </aside>
        <section className="min-w-0 pb-24 lg:pb-0">{children}</section>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden">
          <div className="fixed inset-x-0 top-0 m-3 rounded-3xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Navigation</p>
                <p className="text-base font-semibold text-slate-900">{role} hub</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-5 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "justify-start",
                    pathname === item.href && "bg-slate-100"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">WhatsApp support</p>
              <p className="mt-2">Chat with KasiLink support for assisted orders.</p>
              <Link
                href={supportWhatsApp}
                className={cn(buttonVariants({ size: "sm" }), "mt-3 w-full")}
                target="_blank"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Link>
            </div>
            <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Settings</p>
              <label className="flex items-center justify-between text-sm text-slate-700">
                Low data
                <input
                  type="checkbox"
                  checked={lowDataMode}
                  onChange={(event) => setLowDataMode(event.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between text-sm text-slate-700">
                Large text
                <input
                  type="checkbox"
                  checked={largeText}
                  onChange={(event) => setLargeText(event.target.checked)}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Language
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as "EN" | "ZU" | "ST" | "VE")}
                  className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                >
                  <option value="EN">English</option>
                  <option value="ZU">Zulu</option>
                  <option value="ST">Sotho</option>
                  <option value="VE">Venda</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-4 left-1/2 z-40 flex w-[92%] -translate-x-1/2 justify-between rounded-full border border-slate-200 bg-white/95 p-2 shadow-lg lg:hidden">
        {bottomNav.map((item) =>
          item.external ? (
            <Link
              key={item.href}
              href={item.href}
              target="_blank"
              className={cn(
                "flex flex-1 flex-col items-center justify-center text-xs text-slate-600",
                "rounded-full px-2 py-2"
              )}
            >
              <MessageCircle className="h-4 w-4" />
              {item.label}
            </Link>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center text-xs text-slate-600",
                "rounded-full px-2 py-2",
                pathname === item.href && "bg-slate-100 text-slate-900"
              )}
            >
              <PhoneCall className="h-4 w-4" />
              {item.label}
            </Link>
          )
        )}
      </nav>
    </div>
  );
}
