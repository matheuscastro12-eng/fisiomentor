"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Sparkles,
  Printer,
  MoreVertical,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlanActionsProps {
  planId: string;
  studentId: string;
  status: string;
}

export function PlanActions({ planId, studentId, status }: PlanActionsProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const handleArchive = async () => {
    if (!confirm("Tem certeza que deseja arquivar este plano?")) return;
    setArchiving(true);

    try {
      const response = await fetch(`/api/training-plans/${planId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push(`/dashboard/alunos/${studentId}`);
        router.refresh();
      }
    } catch {
      alert("Erro ao arquivar plano.");
    } finally {
      setArchiving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      {status === "active" && (
        <Button
          variant="secondary"
          size="sm"
          className="gap-1"
          onClick={() => {
            router.push(`/dashboard/alunos/${studentId}/gerar`);
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Gerar Novo
        </Button>
      )}

      <Button variant="ghost" size="icon" onClick={handlePrint}>
        <Printer className="h-4 w-4" />
      </Button>

      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-surface-container-high rounded-xl shadow-ambient-md py-1">
              {status === "active" && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleArchive();
                  }}
                  disabled={archiving}
                  className="flex items-center gap-2 w-full px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container transition-colors"
                >
                  <Archive className="h-4 w-4" />
                  {archiving ? "Arquivando..." : "Arquivar Plano"}
                </button>
              )}
              {status !== "completed" && status !== "archived" && (
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Marcar como Concluído
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
