"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  MessageSquare,
  LogOut,
  ShieldCheck,
  FileOutput,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { href: "/documents",  icon: FileText,         label: "Dokumen" },
  { href: "/findings",   icon: AlertTriangle,    label: "Temuan Risiko" },
  { href: "/chat",       icon: MessageSquare,    label: "Konsultasi AI" },
  { href: "/laporan",    icon: FileOutput,       label: "Laporan" },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [userEmail, setUserEmail]         = useState<string | null>(null);
  const [pendingCount, setPendingCount]   = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    import("@/lib/api").then(({ api }) => {
      api.findings.getSummary().then((s) => setPendingCount(s.pending)).catch(() => {});
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initial = userEmail ? userEmail[0].toUpperCase() : "?";

  return (
    <aside className="flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary shrink-0">
          <ShieldCheck className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide text-sidebar-foreground">PANTAU</p>
          <p className="text-[11px] text-sidebar-foreground/50 leading-none">Audit Keuangan Daerah</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col px-3 py-4 divide-y divide-sidebar-border">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex items-center gap-3 rounded-lg text-sm font-medium transition-colors border-l-2 ${
                active
                  ? "border-l-sidebar-primary bg-sidebar-primary/15 text-sidebar-primary pl-[10px] pr-3"
                  : "border-l-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground px-3"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {label === "Temuan Risiko" && pendingCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-0.5">
        {userEmail && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
            <div className="h-6 w-6 rounded-full bg-sidebar-primary/30 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-sidebar-primary">{initial}</span>
            </div>
            <span className="text-xs text-sidebar-foreground/60 truncate">{userEmail}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
