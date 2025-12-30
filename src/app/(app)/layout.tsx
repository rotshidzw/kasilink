import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/server/auth";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const navByRole = {
  RESIDENT: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/requests", label: "Requests" },
    { href: "/drivers", label: "Drivers" },
    { href: "/events", label: "Events" }
  ],
  BUSINESS: [
    { href: "/business", label: "Business" },
    { href: "/business/products", label: "Products" },
    { href: "/requests", label: "Requests" },
    { href: "/events", label: "Events" }
  ],
  DRIVER: [
    { href: "/driver", label: "Driver" },
    { href: "/requests", label: "Requests" },
    { href: "/events", label: "Events" }
  ],
  ADMIN: [
    { href: "/admin", label: "Admin" },
    { href: "/requests", label: "Requests" },
    { href: "/drivers", label: "Drivers" },
    { href: "/business", label: "Businesses" },
    { href: "/events", label: "Events" }
  ]
} as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const navItems = navByRole[role] ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-400">Navigation</p>
          <p className="text-base font-semibold text-slate-900">{role} hub</p>
        </div>
        <nav className="mt-6 flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">Quick tips</p>
          <p className="mt-2">Use the Requests tab to track lifecycle updates and delivery events.</p>
        </div>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
