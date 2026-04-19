"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Sparkles,
  ClipboardList,
  ChevronRight,
} from "lucide-react";

interface RecentActivityProps {
  sessions: {
    id: string;
    student_id: string;
    session_date: string;
    perceived_effort: number | null;
    exercises_done: any[];
    studentName: string;
  }[];
  plans: {
    id: string;
    student_id: string;
    status: string;
    plan_summary: string | null;
    generated_at: string;
    studentName: string;
  }[];
}

export function RecentActivity({ sessions, plans }: RecentActivityProps) {
  // Merge and sort by date
  const activities = [
    ...sessions.map((s) => ({
      type: "session" as const,
      date: s.session_date,
      data: s,
    })),
    ...plans.map((p) => ({
      type: "plan" as const,
      date: p.generated_at,
      data: p,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 8);

  return (
    <Card className="bg-surface-container-low">
      <CardContent className="pt-0">
        <h3 className="font-display text-title-md text-on-surface mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Atividade Recente
        </h3>

        {activities.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant/50 italic text-center py-8">
            Nenhuma atividade recente
          </p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity, idx) => {
              if (activity.type === "session") {
                const s = activity.data as (typeof sessions)[0];
                const completed =
                  s.exercises_done?.filter((e: any) => e.completed).length ?? 0;
                const total = s.exercises_done?.length ?? 0;
                return (
                  <Link
                    key={`s-${idx}`}
                    href={`/dashboard/alunos/${s.student_id}`}
                    className="flex items-center gap-3 p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <ClipboardList className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-on-surface truncate">
                        {s.studentName}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        Sessão registrada ·{" "}
                        <span className="font-mono text-primary">
                          {completed}/{total}
                        </span>
                        {s.perceived_effort && (
                          <span className="ml-1">
                            · PSE {s.perceived_effort}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-[10px] text-on-surface-variant/50 shrink-0">
                      {formatRelativeDate(s.session_date)}
                    </span>
                  </Link>
                );
              } else {
                const p = activity.data as (typeof plans)[0];
                return (
                  <Link
                    key={`p-${idx}`}
                    href={`/dashboard/alunos/${p.student_id}/plano/${p.id}`}
                    className="flex items-center gap-3 p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-on-surface truncate">
                        {p.studentName}
                      </p>
                      <p className="text-label-sm text-on-surface-variant truncate">
                        Plano gerado
                        {p.plan_summary && ` — ${p.plan_summary}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant={
                          p.status === "active"
                            ? "teal"
                            : p.status === "failed"
                            ? "red"
                            : "neutral"
                        }
                      >
                        {p.status === "active" ? "Ativo" : p.status}
                      </Badge>
                      <ChevronRight className="h-3.5 w-3.5 text-on-surface-variant/40" />
                    </div>
                  </Link>
                );
              }
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffH < 1) return "agora";
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "ontem";
  if (diffD < 7) return `${diffD}d`;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}
