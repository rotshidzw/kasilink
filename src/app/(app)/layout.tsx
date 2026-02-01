import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/server/auth";
import { PreferencesProvider } from "@/components/preferences-provider";
import { AppShellClient } from "@/components/app-shell-client";

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
  ],
  CALLCENTER: [
    { href: "/callcenter", label: "Call center" },
    { href: "/callcenter/callbacks", label: "Callbacks" },
    { href: "/requests", label: "Requests" },
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
    <PreferencesProvider>
      <AppShellClient role={role} navItems={navItems}>
        {children}
      </AppShellClient>
    </PreferencesProvider>
  );
}
