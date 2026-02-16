"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Overview", icon: "◼" },
  { href: "/model", label: "Cost Model", icon: "◻" },
  { href: "/home-ownership", label: "Home Ownership", icon: "△" },
  { href: "/projections", label: "Projections", icon: "◇" },
  { href: "/methodology", label: "Methodology", icon: "☰" },
];

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
        active
          ? "bg-white/10 text-white shadow-sm"
          : "text-white/70 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/80">
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#070B1A] text-white">
      {/* subtle background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute top-24 -right-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-8 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="text-sm font-semibold tracking-tight">Independent Living (VIC)</div>
                <div className="mt-1 text-xs text-white/60 leading-relaxed">
                  Income • essentials • ownership feasibility • projections
                </div>
              </div>

              <nav className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur space-y-1">
                {nav.map((n) => (
                  <NavItem key={n.href} href={n.href} label={n.label} icon={n.icon} />
                ))}
              </nav>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur text-xs text-white/60 leading-relaxed">
                Outputs are indicative. Assumptions and sources are documented in Methodology.
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0 pb-20 lg:pb-0">
            {/* Top bar */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-5 sm:px-6 py-4 backdrop-blur flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center font-semibold">
                  IL
                </div>
                <div>
                  <div className="text-sm sm:text-base font-semibold tracking-tight">
                    Civic Affordability Dashboard
                  </div>
                  <div className="text-xs text-white/60">
                    Victoria • v0.1
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-xs text-white/60">Search</span>
                  <input
                    className="w-44 bg-transparent text-sm outline-none placeholder:text-white/30"
                    placeholder="e.g. rent, duty, LMI"
                  />
                </div>

                <Link
  href="/brief"
  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
>
  Export Brief
</Link>

              </div>
            </div>

            {children}

            {/* Mobile bottom nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#070B1A]/90 backdrop-blur">
              <div className="mx-auto max-w-7xl px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar">
                {nav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={[
                      "rounded-xl px-3 py-2 text-sm whitespace-nowrap transition",
                      usePathname() === n.href
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white",
                    ].join(" ")}
                  >
                    {n.label}
                  </Link>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
