import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GenerateForm } from "./components/generate-form";

interface PageProps {
  params: { id: string };
}

export default async function GenerateTrainingPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("auth_user_id", user?.id ?? "")
    .single();

  // Fetch student with health data
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

  const healthProfile = student.health_profiles;
  const trainingPrefs = student.training_preferences;
  const diagnoses = (healthProfile?.diagnoses as string[]) ?? [];
  const medications = (healthProfile?.medications as any[]) ?? [];

  return (
    <GenerateForm
      studentId={params.id}
      studentName={student.name}
      diagnoses={diagnoses}
      medications={medications}
      cardiovascularRisk={healthProfile?.cardiovascular_risk ?? "baixo"}
      goals={(trainingPrefs?.goals as string[]) ?? []}
      weeklySessions={trainingPrefs?.weekly_sessions ?? 3}
      minutesPerSession={trainingPrefs?.minutes_per_session ?? 60}
      experienceLevel={trainingPrefs?.experience_level ?? "iniciante"}
    />
  );
}
