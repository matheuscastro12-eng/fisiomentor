import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Users } from "lucide-react";

const conditionVariants: Record<string, "red" | "yellow" | "neutral"> = {
  Cardiopatia: "red",
  "Insuficiência Cardíaca": "red",
  DPOC: "red",
  AVC: "red",
  Hérnia: "red",
  "Diabetes T1": "yellow",
  "Diabetes T2": "yellow",
  Hipertensão: "yellow",
  Obesidade: "yellow",
};

export default async function StudentsListPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("auth_user_id", user?.id ?? "")
    .single();

  const { data: students } = await supabase
    .from("students")
    .select("*, health_profiles(*), training_preferences(*)")
    .eq("professional_id", professional?.id ?? "")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-headline-lg text-on-surface mb-1">
            Alunos
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {students?.length ?? 0} alunos cadastrados
          </p>
        </div>
        <Link href="/dashboard/alunos/novo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Aluno
          </Button>
        </Link>
      </div>

      {/* Student Grid */}
      {students && students.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => {
            const diagnoses =
              (student.health_profiles?.diagnoses as string[]) ?? [];
            const age = student.birth_date
              ? calculateAge(student.birth_date)
              : null;
            const initials = student.name
              .split(" ")
              .map((n: string) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            const goals =
              (student.training_preferences?.goals as string[]) ?? [];

            return (
              <Link
                key={student.id}
                href={`/dashboard/alunos/${student.id}`}
              >
                <Card className="bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer group">
                  <CardContent className="pt-0">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant font-display text-title-sm shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-title-sm text-on-surface truncate">
                          {student.name}
                        </h3>
                        <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                          {age && <span>{age} anos</span>}
                          {student.weight_kg && (
                            <span>{student.weight_kg}kg</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Condition badges */}
                    {diagnoses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {diagnoses.slice(0, 3).map((d) => (
                          <Badge
                            key={d}
                            variant={conditionVariants[d] ?? "neutral"}
                          >
                            {d}
                          </Badge>
                        ))}
                        {diagnoses.length > 3 && (
                          <Badge variant="neutral">
                            +{diagnoses.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Goals */}
                    {goals.length > 0 && (
                      <p className="text-label-sm text-on-surface-variant/50 mt-2 truncate">
                        {goals.join(", ")}
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
              <Users className="h-8 w-8 text-on-surface-variant/30" />
            </div>
            <h3 className="font-display text-title-lg text-on-surface mb-2">
              Nenhum aluno cadastrado
            </h3>
            <p className="font-body text-body-md text-on-surface-variant mb-6 text-center max-w-md">
              Cadastre seu primeiro aluno para começar a gerar planos de treino
              personalizados com IA.
            </p>
            <Link href="/dashboard/alunos/novo">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar Primeiro Aluno
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
