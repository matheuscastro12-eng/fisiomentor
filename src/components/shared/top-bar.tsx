"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function TopBar() {
  const [name, setName] = useState("Profissional");
  const [cref, setCref] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("professionals")
        .select("name, cref")
        .eq("auth_user_id", user.id)
        .single();

      if (prof) {
        setName(prof.name ?? "Profissional");
        setCref(prof.cref ?? "");
      }
    }
    load();
  }, []);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-14 lg:h-16 flex items-center justify-between px-4 lg:px-6 glass border-b border-outline-variant">
      {/* Left — logo on mobile, title on desktop */}
      <div className="flex items-center gap-4">
        <h2 className="font-display text-title-sm lg:text-title-md text-primary lg:text-on-surface tracking-wide uppercase">
          <span className="lg:hidden">Curador Clínico</span>
          <span className="hidden lg:inline">PROJETO FISIOMENTOR</span>
        </h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 lg:gap-3">
        <Link href="/dashboard/alunos/novo" className="hidden sm:block">
          <Button size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden md:inline">Gerar Plano IA</span>
          </Button>
        </Link>

        <button className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">
          <Bell className="h-5 w-5" />
        </button>

        <Link
          href="/dashboard/configuracoes"
          className="hidden lg:block p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <Settings className="h-5 w-5" />
        </Link>

        {/* User avatar */}
        <div className="flex items-center gap-2 lg:gap-3 ml-1 lg:ml-2">
          <div className="text-right hidden md:block">
            <p className="font-body text-body-sm text-on-surface font-medium">
              {name}
            </p>
            {cref && (
              <p className="font-mono text-label-sm text-on-surface-variant">
                CREF {cref}
              </p>
            )}
          </div>
          <div className="h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-gradient-primary flex items-center justify-center text-on-primary font-display text-label-sm lg:text-label-lg">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
