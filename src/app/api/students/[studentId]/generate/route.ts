import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  trainingPlans,
  students,
  healthProfiles,
  trainingPreferences,
  physicalAssessments,
} from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getAuthenticatedProfessional } from "@/lib/auth-api";
import { calculateAge } from "@/lib/utils";
import {
  generateTrainingPlan,
  type GenerationInput,
} from "../../../../../../server/lib/training-generator";

export async function POST(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const auth = await getAuthenticatedProfessional();
  if (auth instanceof NextResponse) return auth;

  const { studentId } = params;
  const body = await request.json().catch(() => ({}));
  const { professionalNotes } = body;

  const [student] = await db
    .select()
    .from(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.professionalId, auth.professionalId)
      )
    )
    .limit(1);

  if (!student) {
    return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
  }

  const [healthProfile] = await db
    .select()
    .from(healthProfiles)
    .where(eq(healthProfiles.studentId, studentId))
    .limit(1);

  const [trainingPref] = await db
    .select()
    .from(trainingPreferences)
    .where(eq(trainingPreferences.studentId, studentId))
    .limit(1);

  const [assessment] = await db
    .select()
    .from(physicalAssessments)
    .where(eq(physicalAssessments.studentId, studentId))
    .orderBy(desc(physicalAssessments.assessedAt))
    .limit(1);

  const [pendingPlan] = await db
    .insert(trainingPlans)
    .values({
      studentId,
      professionalId: auth.professionalId,
      status: "processing",
    })
    .returning();

  try {
    const input: GenerationInput = {
      student: {
        name: student.name,
        age: student.birthDate
          ? calculateAge(student.birthDate.toISOString())
          : null,
        sex: student.sex,
        weightKg: student.weightKg,
        heightCm: student.heightCm,
      },
      healthProfile: {
        diagnoses: (healthProfile?.diagnoses as string[]) ?? [],
        medications: (healthProfile?.medications as any[]) ?? [],
        injuries: (healthProfile?.injuries as string[]) ?? [],
        surgeries: (healthProfile?.surgeries as any[]) ?? [],
        cardiovascularRisk: healthProfile?.cardiovascularRisk ?? "baixo",
        parqResult: healthProfile?.parqResult,
      },
      trainingPrefs: {
        experienceLevel: trainingPref?.experienceLevel ?? "iniciante",
        preferredModalities:
          (trainingPref?.preferredModalities as string[]) ?? [],
        weeklySessions: trainingPref?.weeklySessions ?? 3,
        minutesPerSession: trainingPref?.minutesPerSession ?? 60,
        goals: (trainingPref?.goals as string[]) ?? [],
      },
      physicalAssessment: assessment
        ? {
            bodyFatPct: assessment.bodyFatPct ?? undefined,
            leanMassKg: assessment.leanMassKg ?? undefined,
            bmi: assessment.bmi ?? undefined,
            fitnessTests: (assessment.fitnessTests as any[]) ?? [],
          }
        : undefined,
      professionalNotes,
    };

    const result = await generateTrainingPlan(input);

    await db
      .update(trainingPlans)
      .set({
        status: "active",
        planData: result.plan as any,
        planSummary: result.summary,
        restrictions: result.restrictions as any,
        monitoringNotes: result.monitoringNotes as any,
      })
      .where(eq(trainingPlans.id, pendingPlan.id));

    await db
      .update(trainingPlans)
      .set({ status: "archived" })
      .where(
        and(
          eq(trainingPlans.studentId, studentId),
          eq(trainingPlans.status, "active"),
          sql`id != ${pendingPlan.id}`
        )
      );

    return NextResponse.json({
      id: pendingPlan.id,
      status: "active",
      plan: result.plan,
      summary: result.summary,
      restrictions: result.restrictions,
      monitoringNotes: result.monitoringNotes,
      ragSources: result.ragSources,
    });
  } catch (error: any) {
    await db
      .update(trainingPlans)
      .set({ status: "failed", errorMessage: error.message })
      .where(eq(trainingPlans.id, pendingPlan.id));

    return NextResponse.json(
      { error: "Falha na geração do plano.", details: error.message },
      { status: 500 }
    );
  }
}
