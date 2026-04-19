"use client";

import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SearchAndActions() {
  const router = useRouter();

  return (
    <Card className="bg-surface-container-low">
      <CardContent className="flex flex-col sm:flex-row items-center gap-4 pt-0">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar aluno por nome, CPF ou patologia..."
            className="w-full h-11 bg-surface-container-highest rounded-xl pl-11 pr-4 font-body text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          />
        </div>
        <Button variant="secondary" className="gap-2 whitespace-nowrap">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros Avançados
        </Button>
        <Button className="gap-2 whitespace-nowrap">
          <Sparkles className="h-4 w-4" />
          Gerar Plano IA
        </Button>
      </CardContent>
    </Card>
  );
}
