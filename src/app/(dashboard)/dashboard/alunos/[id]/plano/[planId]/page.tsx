import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Shield,
  Stethoscope,
  Dumbbell,
} from "lucide-react";
import { PlanActions } from "./components/plan-actions";
import { ExportPDF } from "./components/export-pdf";

interface PageProps {
  params: { id: string; planId: string };
}

export default async function PlanReviewPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("auth_user_id", user?.id ?? "")
    .single();

  // Fetch professional details
  const { data: prof } = await supabase
    .from("professionals")
    .select("id, name, cref")
    .eq("id", professional?.id ?? "")
    .single();

  // Fetch student with health profile
  const { data: student } = await supabase
    .from("students")
    .select("id, name, birth_date, health_profiles(diagnoses)")
    .eq("id", params.id)
    .eq("professional_id", professional?.id ?? "")
    .single();

  if (!student) notFound();

  const studentAge = student.birth_date
    ? Math.floor(
        (Date.now() - new Date(student.birth_date).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;
  const studentConditions =
    ((student.health_profiles as any)?.diagnoses as string[]) ?? [];

  // Fetch plan
  const { data: plan } = await supabase
    .from("training_plans")
    .select("*")
    .eq("id", params.planId)
    .eq("professional_id", professional?.id ?? "")
    .single();

  if (!plan) notFound();

  const planData = plan.plan_data as any;
  const restrictions = (plan.restrictions as any[]) ?? [];
  const monitoringNotes = (plan.monitoring_notes as string[]) ?? [];
  const redFlags = restrictions.filter((r) => r.type === "red");
  const yellowFlags = restrictions.filter((r) => r.type === "yellow");
  const greenFlags = restrictions.filter((r) => r.type === "green");

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Back link */}
      <Link
        href={`/dashboard/alunos/${params.id}`}
        className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao perfil de {student.name}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-headline-lg text-on-surface mb-1">
            Revisão do Plano de Treino
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {plan.plan_summary ?? "Plano gerado por IA"}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={
                plan.status === "active"
                  ? "teal"
                  : plan.status === "failed"
                  ? "red"
                  : "neutral"
              }
            >
              {plan.status === "active"
                ? "Ativo"
                : plan.status === "completed"
                ? "Concluído"
                : plan.status === "failed"
                ? "Falhou"
                : plan.status}
            </Badge>
            <span className="text-label-sm text-on-surface-variant">
              Gerado em{" "}
              {new Date(plan.generated_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportPDF
            studentName={student.name}
            studentAge={studentAge}
            studentConditions={studentConditions}
            professionalName={prof?.name}
            professionalCref={prof?.cref}
            planSummary={plan.plan_summary ?? ""}
            planData={planData}
            restrictions={restrictions}
            monitoringNotes={monitoringNotes}
            assessmentProtocols={(plan.assessment_protocols as string[]) ?? []}
          />
          <PlanActions
            planId={params.planId}
            studentId={params.id}
            status={plan.status}
          />
        </div>
      </div>

      {/* Clinical Validation Summary */}
      {restrictions.length > 0 && (
        <Card className="bg-surface-container-low mb-6">
          <CardContent className="pt-0">
            <h2 className="font-display text-title-lg text-on-surface mb-4 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Validação Clínica
            </h2>

            {/* Red Flags */}
            {redFlags.length > 0 && (
              <div className="mb-4">
                <h3 className="text-label-sm text-error uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Contraindicações ({redFlags.length})
                </h3>
                <div className="space-y-2">
                  {redFlags.map((r, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-error-container/10 border-l-2 border-error"
                    >
                      <p className="text-body-sm text-on-surface font-medium mb-1">
                        {r.description}
                      </p>
                      {r.affectedExercises?.length > 0 && (
                        <p className="text-label-sm text-error">
                          Exercícios: {r.affectedExercises.join(", ")}
                        </p>
                      )}
                      {r.suggestion && (
                        <p className="text-body-sm text-on-surface-variant mt-1">
                          💡 {r.suggestion}
                        </p>
                      )}
                      <p className="text-label-sm text-on-surface-variant/50 mt-1">
                        Fonte: {r.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Yellow Flags */}
            {yellowFlags.length > 0 && (
              <div className="mb-4">
                <h3 className="text-label-sm text-warning uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  Cautelas ({yellowFlags.length})
                </h3>
                <div className="space-y-2">
                  {yellowFlags.map((r, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-warning-container/10 border-l-2 border-warning"
                    >
                      <p className="text-body-sm text-on-surface">
                        {r.description}
                      </p>
                      {r.suggestion && (
                        <p className="text-body-sm text-on-surface-variant mt-1">
                          💡 {r.suggestion}
                        </p>
                      )}
                      <p className="text-label-sm text-on-surface-variant/50 mt-1">
                        Fonte: {r.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Green Flags */}
            {greenFlags.length > 0 && (
              <div>
                <h3 className="text-label-sm text-success uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Recomendações ({greenFlags.length})
                </h3>
                <div className="space-y-2">
                  {greenFlags.map((r, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-success-container/10 border-l-2 border-success"
                    >
                      <p className="text-body-sm text-on-surface">
                        {r.description}
                      </p>
                      {r.suggestion && (
                        <p className="text-body-sm text-on-surface-variant mt-1">
                          💡 {r.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Weekly Split - Exercise Plan */}
      <div className="space-y-4 mb-6">
        <h2 className="font-display text-title-lg text-on-surface flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          Plano Semanal
        </h2>

        {planData?.weekly_split?.map((day: any, idx: number) => (
          <Card key={idx} className="bg-surface-container-low">
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-title-md text-on-surface">
                  {day.day}
                </h3>
                <Badge variant="teal">{day.session_type}</Badge>
              </div>

              {/* Exercise Table */}
              <div className="space-y-0">
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
                      exIdx % 2 === 0
                        ? ""
                        : "bg-surface-container rounded-lg px-2 -mx-2"
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
      </div>

      {/* Monitoring Notes */}
      {monitoringNotes.length > 0 && (
        <Card className="bg-surface-container-low mb-6">
          <CardContent className="pt-0">
            <h2 className="font-display text-title-lg text-on-surface mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Cuidados de Monitoramento
            </h2>
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
