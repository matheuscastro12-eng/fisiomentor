import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  physicalAssessments,
  progressRecords,
  students,
  type FitnessTest,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthenticatedProfessional } from "@/lib/auth-api";

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const auth = await getAuthenticatedProfessional();
  if (auth instanceof NextResponse) return auth;

  const { studentId } = params;

  // Verify ownership
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.professionalId, auth.professionalId)
      )
    )
    .limit(1);

  if (!student) {
    return NextResponse.json(
      { error: "Aluno não encontrado." },
      { status: 404 }
    );
  }

  const assessments = await db
    .select()
    .from(physicalAssessments)
    .where(eq(physicalAssessments.studentId, studentId))
    .orderBy(desc(physicalAssessments.assessedAt));

  return NextResponse.json(assessments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const auth = await getAuthenticatedProfessional();
  if (auth instanceof NextResponse) return auth;

  const { studentId } = params;

  // Verify ownership
  const [student] = await db
    .select({
      id: students.id,
      weightKg: students.weightKg,
    })
    .from(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.professionalId, auth.professionalId)
      )
    )
    .limit(1);

  if (!student) {
    return NextResponse.json(
      { error: "Aluno não encontrado." },
      { status: 404 }
    );
  }

  const body = await request.json();

  // Accept both camelCase and snake_case, normalize to numbers
  const toNum = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return isNaN(n) ? null : n;
  };

  const bodyFatPct = toNum(body.bodyFatPct ?? body.body_fat_pct);
  const leanMassKg = toNum(body.leanMassKg ?? body.lean_mass_kg);
  const bmi = toNum(body.bmi);
  const weightKg = toNum(body.weightKg ?? body.weight_kg);
  const fitnessTests: FitnessTest[] = Array.isArray(
    body.fitnessTests ?? body.fitness_tests
  )
    ? (body.fitnessTests ?? body.fitness_tests).filter(
        (t: FitnessTest) =>
          t && t.name?.trim() && t.result?.trim() && t.unit?.trim()
      )
    : [];

  // 1) Insert the assessment row
  const [assessment] = await db
    .insert(physicalAssessments)
    .values({
      studentId,
      bodyFatPct,
      leanMassKg,
      bmi,
      fitnessTests,
      createdBy: auth.professionalId,
    })
    .returning();

  // 2) Also write progress records so the progress charts populate
  const progressRows: Array<{
    studentId: string;
    assessmentId: string;
    metricType: string;
    value: number;
    unit: string;
  }> = [];

  if (weightKg != null) {
    progressRows.push({
      studentId,
      assessmentId: assessment.id,
      metricType: "weight_kg",
      value: weightKg,
      unit: "kg",
    });
  }
  if (bodyFatPct != null) {
    progressRows.push({
      studentId,
      assessmentId: assessment.id,
      metricType: "body_fat_pct",
      value: bodyFatPct,
      unit: "%",
    });
  }
  if (leanMassKg != null) {
    progressRows.push({
      studentId,
      assessmentId: assessment.id,
      metricType: "lean_mass_kg",
      value: leanMassKg,
      unit: "kg",
    });
  }
  if (bmi != null) {
    progressRows.push({
      studentId,
      assessmentId: assessment.id,
      metricType: "bmi",
      value: bmi,
      unit: "kg/m²",
    });
  }

  // Fitness tests: store as progress metrics where the result is numeric
  for (const t of fitnessTests) {
    const numeric = parseFloat(t.result);
    if (!isNaN(numeric)) {
      progressRows.push({
        studentId,
        assessmentId: assessment.id,
        metricType: `test:${t.name}`,
        value: numeric,
        unit: t.unit,
      });
    }
  }

  if (progressRows.length > 0) {
    await db.insert(progressRecords).values(progressRows);
  }

  // 3) If a new weight was recorded, keep the student row in sync
  if (weightKg != null && weightKg !== student.weightKg) {
    await db
      .update(students)
      .set({ weightKg })
      .where(eq(students.id, studentId));
  }

  return NextResponse.json(assessment, { status: 201 });
}
