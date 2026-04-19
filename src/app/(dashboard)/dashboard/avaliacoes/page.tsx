import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Calendar, User, Activity } from "lucide-react";

export default async function AvaliacoesPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("auth_user_id", user?.id ?? "")
    .single();

  // Get all students for this professional
  const { data: students } = await supabase
    .from("students")
    .select("id, name")
    .eq("professional_id", professional?.id ?? "")
    .is("deleted_at", null);

  const studentIds = students?.map((s) => s.id) ?? [];
  const studentMap = new Map(
    (students ?? []).map((s) => [s.id, s.name])
  );

  // Get assessments for those students
  const { data: assessments } = studentIds.length > 0
    ? await supabase
        .from("physical_assessments")
        .select("*")
        .in("student_id", studentIds)
        .order("assessed_at", { ascending: false })
    : { data: [] };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-headline-lg text-on-surface mb-1">
            Avaliações Físicas
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {assessments?.length ?? 0} avaliações realizadas
          </p>
        </div>
      </div>

      {assessments && assessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map((assessment: any) => {
            const date = assessment.assessed_at
              ? new Date(assessment.assessed_at).toLocaleDateString("pt-BR")
              : "";
            const studentName = studentMap.get(assessment.student_id) ?? "Aluno";
            const tests = (assessment.fitness_tests as any[]) ?? [];

            return (
              <Link
                key={assessment.id}
                href={`/dashboard/alunos/${assessment.student_id}`}
              >
                <Card className="bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer group">
                  <CardContent className="pt-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-tertiary/10 flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-tertiary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant mb-0.5">
                          <User className="h-3.5 w-3.5" />
                          <span className="truncate">{studentName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant/50">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {assessment.bmi && (
                        <div className="bg-surface-container rounded-lg p-2 text-center">
                          <p className="text-label-sm text-on-surface-variant">IMC</p>
                          <p className="text-title-sm text-on-surface font-display">
                            {assessment.bmi.toFixed(1)}
                          </p>
                        </div>
                      )}
                      {assessment.body_fat_pct && (
                        <div className="bg-surface-container rounded-lg p-2 text-center">
                          <p className="text-label-sm text-on-surface-variant">% Gordura</p>
                          <p className="text-title-sm text-on-surface font-display">
                            {assessment.body_fat_pct.toFixed(1)}
                          </p>
                        </div>
                      )}
                      {assessment.lean_mass_kg && (
                        <div className="bg-surface-container rounded-lg p-2 text-center">
                          <p className="text-label-sm text-on-surface-variant">Massa Magra</p>
                          <p className="text-title-sm text-on-surface font-display">
                            {assessment.lean_mass_kg.toFixed(1)}kg
                          </p>
                        </div>
                      )}
                    </div>

                    {tests.length > 0 && (
                      <p className="text-label-sm text-on-surface-variant/50 mt-2">
                        {tests.length} teste{tests.length !== 1 ? "s" : ""} realizado{tests.length !== 1 ? "s" : ""}
                      </p>
                    )}
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
              <Activity className="h-8 w-8 text-on-surface-variant/30" />
            </div>
            <h3 className="font-display text-title-lg text-on-surface mb-2">
              Nenhuma avaliação registrada
            </h3>
            <p className="font-body text-body-md text-on-surface-variant mb-6 text-center max-w-md">
              As avaliações físicas aparecem aqui depois que você registrar uma
              para algum aluno.
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
