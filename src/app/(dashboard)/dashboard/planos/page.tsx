import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Calendar, User, FileText } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  generating: "Gerando...",
  ready: "Pronto",
  error: "Erro",
};

const statusVariants: Record<string, "neutral" | "yellow" | "red"> = {
  pending: "yellow",
  generating: "yellow",
  ready: "neutral",
  error: "red",
};

export default async function PlanosPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("auth_user_id", user?.id ?? "")
    .single();

  const { data: plans } = await supabase
    .from("training_plans")
    .select("*, students(id, name)")
    .eq("professional_id", professional?.id ?? "")
    .order("generated_at", { ascending: false });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-headline-lg text-on-surface mb-1">
            Planos de Treino
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {plans?.length ?? 0} planos gerados
          </p>
        </div>
      </div>

      {plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan: any) => {
            const date = plan.generated_at
              ? new Date(plan.generated_at).toLocaleDateString("pt-BR")
              : "";

            return (
              <Link
                key={plan.id}
                href={`/dashboard/alunos/${plan.student_id}/plano/${plan.id}`}
              >
                <Card className="bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer group">
                  <CardContent className="pt-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant={statusVariants[plan.status] ?? "neutral"}>
                        {statusLabels[plan.status] ?? plan.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant mb-1">
                      <User className="h-3.5 w-3.5" />
                      <span>{plan.students?.name ?? "Aluno"}</span>
                    </div>

                    {plan.plan_summary && (
                      <p className="text-body-sm text-on-surface-variant/70 line-clamp-2 mb-3">
                        {plan.plan_summary}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant/50">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{date}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="bg-surface-container-low">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-on-surface-variant/30" />
            </div>
            <h3 className="font-display text-title-lg text-on-surface mb-2">
              Nenhum plano gerado
            </h3>
            <p className="font-body text-body-md text-on-surface-variant mb-6 text-center max-w-md">
              Os planos de treino aparecem aqui depois que você gerar um para
              algum aluno.
            </p>
            <Link href="/dashboard/alunos">
              <span className="text-primary text-body-sm font-medium hover:underline">
                Ir para Alunos
              </span>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
