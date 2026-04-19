"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, ChevronRight } from "lucide-react";

interface HistoryTabProps {
  plans: any[];
  studentId: string;
}

const statusMap: Record<string, { label: string; variant: "teal" | "yellow" | "red" | "neutral" }> = {
  active: { label: "Ativo", variant: "teal" },
  completed: { label: "Concluído", variant: "teal" },
  pending: { label: "Gerando...", variant: "yellow" },
  processing: { label: "Processando", variant: "yellow" },
  failed: { label: "Falhou", variant: "red" },
  archived: { label: "Arquivado", variant: "neutral" },
};

export function HistoryTab({ plans, studentId }: HistoryTabProps) {
  if (plans.length === 0) {
    return (
      <Card className="bg-surface-container-low">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ClipboardList className="h-12 w-12 text-on-surface-variant/30 mb-4" />
          <p className="text-body-md text-on-surface-variant">
            Nenhum plano no histórico
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface-container-low">
      <CardContent className="pt-0">
        <h3 className="font-display text-title-md text-on-surface mb-4">
          Histórico de Planos
        </h3>
        <div className="space-y-3">
          {plans.map((plan) => {
            const status = statusMap[plan.status] ?? statusMap.archived;
            return (
              <Link
                key={plan.id}
                href={`/dashboard/alunos/${studentId}/plano/${plan.id}`}
                className="flex items-center justify-between p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-body text-title-sm text-on-surface">
                    {plan.plan_summary || "Plano de treino"}
                  </p>
                  <p className="font-mono text-label-sm text-on-surface-variant mt-1">
                    {new Date(plan.generated_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <ChevronRight className="h-4 w-4 text-on-surface-variant/50" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
