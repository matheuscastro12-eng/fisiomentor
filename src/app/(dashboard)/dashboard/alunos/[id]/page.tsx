import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Pencil,
  Share2,
  Sparkles,
  ArrowLeft,
  Activity,
  Dumbbell,
  HeartPulse,
  ClipboardList,
  Ruler,
} from "lucide-react";
import { ActivePlanTab } from "./components/active-plan-tab";
import { HistoryTab } from "./components/history-tab";
import { HealthDataTab } from "./components/health-data-tab";
import { ProgressTab } from "./components/progress-tab";

interface PageProps {
  params: { id: string };
}

const conditionColors: Record<string, "red" | "yellow" | "neutral"> = {
  Cardiopatia: "red",
  "Insuficiência Cardíaca": "red",
  DPOC: "red",
  AVC: "red",
  Hérnia: "red",
  "Diabetes T1": "yellow",
  "Diabetes T2": "yellow",
  "Diabetes Tipo II": "yellow",
  Hipertensão: "yellow",
  Obesidade: "yellow",
};

export default async function StudentProfilePage({ params }: PageProps) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("auth_user_id", user?.id ?? "")
    .single();

  // Fetch student with all related data
  const { data: student } = await supabase
    .from("students")
    .select(
      "*, health_profiles(*), training_preferences(*), physical_assessments(*)"
    )
    .eq("id", params.id)
    .eq("professional_id", professional?.id ?? "")
    .is("deleted_at", null)
    .single();

  if (!student) notFound();

  // Fetch training plans
  const { data: plans } = await supabase
    .from("training_plans")
    .select("*")
    .eq("student_id", params.id)
    .order("generated_at", { ascending: false });

  const activePlan = plans?.find(
    (p) => p.status === "active" || p.status === "completed"
  );

  const healthProfile = student.health_profiles;
  const trainingPrefs = student.training_preferences;
  const diagnoses = (healthProfile?.diagnoses as string[]) ?? [];
  const age = student.birth_date ? calculateAge(student.birth_date) : null;
  const initials = student.name
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="animate-fade-in">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        {/* ─── Left Column (1/3): Student Card ─── */}
        <div className="space-y-6">
          <Card className="bg-surface-container-low">
            <CardContent className="flex flex-col items-center text-center pt-0">
              {/* Avatar */}
              <div className="h-24 w-24 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant font-display text-display-sm mb-4">
                {initials}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                {diagnoses.length > 0 ? (
                  diagnoses.map((cond) => (
                    <Badge
                      key={cond}
                      variant={conditionColors[cond] ?? "neutral"}
                    >
                      {cond}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="green">Sem restrições</Badge>
                )}
              </div>

              {/* Name & info */}
              <h1 className="font-display text-headline-md text-on-surface mb-1">
                {student.name}
              </h1>
              <div className="flex items-center gap-4 text-body-sm text-on-surface-variant font-body">
                {age && <span>{age} Anos</span>}
                {student.weight_kg && (
                  <span>{student.weight_kg} kg</span>
                )}
                {student.height_cm && (
                  <span>{student.height_cm} cm</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6 w-full">
                <Button variant="secondary" size="sm" className="flex-1 gap-1">
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button variant="secondary" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* CTAs */}
              <Link
                href={`/dashboard/alunos/${params.id}/gerar`}
                className="w-full mt-4"
              >
                <Button className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  Gerar Novo Treino
                </Button>
              </Link>
              {activePlan && (
                <Link
                  href={`/dashboard/alunos/${params.id}/sessao`}
                  className="w-full mt-2"
                >
                  <Button variant="secondary" className="w-full gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Registrar Sessão
                  </Button>
                </Link>
              )}
              <Link
                href={`/dashboard/alunos/${params.id}/avaliacao/nova`}
                className="w-full mt-2"
              >
                <Button variant="secondary" className="w-full gap-2">
                  <Ruler className="h-4 w-4" />
                  Nova Avaliação Física
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {student.physical_assessments?.length > 0 && (
            <Card className="bg-surface-container-low">
              <CardContent className="pt-0">
                <h3 className="font-display text-title-sm text-on-surface mb-4">
                  Última Avaliação
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {student.physical_assessments[0]?.body_fat_pct && (
                    <div className="bg-surface-container rounded-xl p-3 text-center">
                      <p className="font-mono text-headline-sm text-primary">
                        {student.physical_assessments[0].body_fat_pct}%
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        Gordura Corporal
                      </p>
                    </div>
                  )}
                  {student.physical_assessments[0]?.lean_mass_kg && (
                    <div className="bg-surface-container rounded-xl p-3 text-center">
                      <p className="font-mono text-headline-sm text-on-surface">
                        {student.physical_assessments[0].lean_mass_kg}
                        <span className="text-body-sm text-on-surface-variant ml-1">
                          kg
                        </span>
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        Massa Magra
                      </p>
                    </div>
                  )}
                  {student.weight_kg && (
                    <div className="bg-surface-container rounded-xl p-3 text-center">
                      <p className="font-mono text-headline-sm text-on-surface">
                        {student.weight_kg}
                        <span className="text-body-sm text-on-surface-variant ml-1">
                          kg
                        </span>
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        Peso Atual
                      </p>
                    </div>
                  )}
                  {student.physical_assessments[0]?.bmi && (
                    <div className="bg-surface-container rounded-xl p-3 text-center">
                      <p className="font-mono text-headline-sm text-on-surface">
                        {student.physical_assessments[0].bmi}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        IMC
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─── Right Column (2/3): Tabs ─── */}
        <div>
          <Tabs defaultValue="plano">
            <TabsList>
              <TabsTrigger value="plano" className="gap-2">
                <Dumbbell className="h-4 w-4" />
                Plano Atual
              </TabsTrigger>
              <TabsTrigger value="historico" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="evolucao" className="gap-2">
                <Activity className="h-4 w-4" />
                Evolução
              </TabsTrigger>
              <TabsTrigger value="saude" className="gap-2">
                <HeartPulse className="h-4 w-4" />
                Dados de Saúde
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plano">
              <ActivePlanTab plan={activePlan ?? null} studentId={params.id} />
            </TabsContent>

            <TabsContent value="historico">
              <HistoryTab plans={plans ?? []} studentId={params.id} />
            </TabsContent>

            <TabsContent value="evolucao">
              <ProgressTab studentId={params.id} />
            </TabsContent>

            <TabsContent value="saude">
              <HealthDataTab
                healthProfile={healthProfile}
                trainingPrefs={trainingPrefs}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
