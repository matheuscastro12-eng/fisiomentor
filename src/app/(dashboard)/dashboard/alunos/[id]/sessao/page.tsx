import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SessionLogger } from "./components/session-logger";

interface PageProps {
  params: { id: string };
}

export default async function LogSessionPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("auth_user_id", user?.id ?? "")
    .single();

  // Buscar aluno com plano ativo
  const { data: student } = await supabase
    .from("students")
    .select("id, name")
    .eq("id", params.id)
    .eq("professional_id", professional?.id ?? "")
    .is("deleted_at", null)
    .single();

  if (!student) notFound();

  // Buscar plano ativo
  const { data: activePlan } = await supabase
    .from("training_plans")
    .select("id, plan_data, plan_summary")
    .eq("student_id", params.id)
    .eq("status", "active")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (!activePlan) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <h1 className="font-display text-headline-lg text-on-surface mb-4">
          Nenhum Plano Ativo
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Este aluno não possui um plano de treino ativo. Gere um plano antes de registrar sessões.
        </p>
      </div>
    );
  }

  return (
    <SessionLogger
      studentId={params.id}
      studentName={student.name}
      planId={activePlan.id}
      planData={activePlan.plan_data as any}
      planSummary={activePlan.plan_summary}
    />
  );
}
