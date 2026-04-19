"use client";

import Link from "next/link";
import { Sparkles, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActivePlanTabProps {
  plan: any | null;
  studentId: string;
}

export function ActivePlanTab({ plan, studentId }: ActivePlanTabProps) {
  if (!plan) {
    return (
      <Card className="bg-surface-container-low">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-16 w-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-on-surface-variant/30" />
          </div>
          <h3 className="font-display text-title-lg text-on-surface mb-2">
            Nenhum plano de treino ativo
          </h3>
          <p className="font-body text-body-md text-on-surface-variant mb-6 text-center max-w-md">
            Gere o primeiro plano de treino personalizado com IA para este aluno.
          </p>
          <Link href={`/dashboard/alunos/${studentId}/gerar`}>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar Primeiro Treino
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const planData = plan.plan_data;
  const restrictions = (plan.restrictions as any[]) ?? [];
  const monitoringNotes = (plan.monitoring_notes as string[]) ?? [];

  return (
    <div className="space-y-4">
      {/* Weekly Split */}
      {planData?.weekly_split?.map((day: any, idx: number) => (
        <Card key={idx} className="bg-surface-container-low">
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display text-title-md text-on-surface">
                {day.day}
              </h4>
              <Badge variant="teal">{day.session_type}</Badge>
            </div>

            {/* Exercise Table */}
            <div className="space-y-0">
              {/* Header */}
              <div className="grid grid-cols-[2fr_0.8fr_0.8fr_0.8fr_1.5fr] gap-3 pb-2">
                <span className="table-header">Exercício</span>
                <span className="table-header">Séries</span>
                <span className="table-header">Reps</span>
                <span className="table-header">Descanso</span>
                <span className="table-header">Carga</span>
              </div>
              {day.exercises?.map((ex: any, exIdx: number) => (
                <div
                  key={exIdx}
                  className={`grid grid-cols-[2fr_0.8fr_0.8fr_0.8fr_1.5fr] gap-3 py-3 ${
                    exIdx % 2 === 0 ? "" : "bg-surface-container rounded-lg px-2 -mx-2"
                  }`}
                >
                  <div>
                    <p className="font-body text-body-md text-on-surface">
                      {ex.name}
                    </p>
                    {ex.notes && (
                      <p className="text-body-sm text-on-surface-variant/70 mt-0.5">
                        {ex.notes}
                      </p>
                    )}
                  </div>
                  <p className="font-mono text-body-md text-primary">
                    {ex.sets}
                  </p>
                  <p className="font-mono text-body-md text-primary">
                    {ex.reps}
                  </p>
                  <p className="font-mono text-body-md text-on-surface-variant">
                    {ex.rest_seconds}s
                  </p>
                  <p className="font-body text-body-sm text-on-surface-variant">
                    {ex.load_guidance}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Restrictions */}
      {restrictions.length > 0 && (
        <Card className="bg-surface-container-low">
          <CardContent className="pt-0">
            <h4 className="font-display text-title-md text-on-surface mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Restrições
            </h4>
            <div className="space-y-2">
              {restrictions.map((r: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl ${
                    r.type === "red"
                      ? "bg-error-container/10 border-l-2 border-error"
                      : r.type === "yellow"
                      ? "bg-warning-container/10 border-l-2 border-warning"
                      : "bg-success-container/10 border-l-2 border-success"
                  }`}
                >
                  <p className="font-body text-body-sm text-on-surface">
                    {r.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monitoring Notes */}
      {monitoringNotes.length > 0 && (
        <Card className="bg-surface-container-low">
          <CardContent className="pt-0">
            <h4 className="font-display text-title-md text-on-surface mb-3">
              Cuidados de Monitoramento
            </h4>
            <ul className="space-y-2">
              {monitoringNotes.map((note: string, idx: number) => (
                <li
                  key={idx}
                  className="font-body text-body-sm text-on-surface-variant pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary"
                >
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
