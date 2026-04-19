import { Users, Brain, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MetricCardsProps {
  totalStudents: number;
  plansGenerated: number;
  pendingReevals: number;
}

export function MetricCards({
  totalStudents,
  plansGenerated,
  pendingReevals,
}: MetricCardsProps) {
  const metrics = [
    {
      label: "Total de Alunos",
      value: String(totalStudents).padStart(2, "0"),
      badge: totalStudents > 0 ? "Ativos" : "Nenhum cadastrado",
      badgeVariant: "teal" as const,
      icon: Users,
    },
    {
      label: "Planos Gerados (IA)",
      value: String(plansGenerated).padStart(2, "0"),
      badge: "Este mês",
      badgeVariant: "teal" as const,
      icon: Brain,
    },
    {
      label: "Reavaliações Pendentes",
      value: String(pendingReevals).padStart(2, "0"),
      badge:
        pendingReevals > 0
          ? `${pendingReevals > 3 ? "Urgente" : "Vencimento em breve"}`
          : "Tudo em dia",
      badgeVariant: pendingReevals > 0 ? ("yellow" as const) : ("green" as const),
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="bg-surface-container-low">
          <CardContent className="pt-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-body text-body-sm text-on-surface-variant mb-1">
                  {metric.label}
                </p>
                <p className="font-display text-display-sm text-primary">
                  {metric.value}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-surface-container">
                <metric.icon className="h-5 w-5 text-on-surface-variant" />
              </div>
            </div>
            <Badge variant={metric.badgeVariant} className="mt-3">
              {metric.badge}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
