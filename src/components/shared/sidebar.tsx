"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  ClipboardList,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/alunos", icon: Users, label: "Alunos" },
  { href: "/dashboard/planos", icon: Dumbbell, label: "Planos de Treino" },
  { href: "/dashboard/avaliacoes", icon: ClipboardList, label: "Avaliações" },
  { href: "/dashboard/configuracoes", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[220px] flex flex-col glass border-r border-outline-variant">
      {/* Logo */}
      <div className="px-5 py-6">
        <Link href="/dashboard" className="block">
          <h1 className="font-display text-title-lg text-primary">
            Curador Clínico
          </h1>
          <p className="font-body text-label-sm text-on-surface-variant uppercase tracking-widest mt-0.5">
            Gestão de Performance
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200",
                "font-body text-body-md",
                isActive
                  ? "text-primary bg-primary/10 border-l-2 border-primary"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* New Training CTA */}
      <div className="px-4 pb-4">
        <Button className="w-full gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Novo Treino
        </Button>
      </div>

      {/* Footer */}
      <div className="px-3 pb-6 space-y-1">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors font-body text-body-md">
          <HelpCircle className="h-5 w-5" />
          <span>Suporte</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-colors font-body text-body-md"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
