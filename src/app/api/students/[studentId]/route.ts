import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  students,
  healthProfiles,
  trainingPreferences,
  physicalAssessments,
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
    return NextResponse.json(
      { error: "Aluno não encontrado." },
      { status: 404 }
    );
  }

  const [healthProfile] = await db
    .select()
    .from(healthProfiles)
    .where(eq(healthProfiles.studentId, studentId))
    .limit(1);

  const [trainingPrefs] = await db
    .select()
    .from(trainingPreferences)
    .where(eq(trainingPreferences.studentId, studentId))
    .limit(1);

  const [latestAssessment] = await db
    .select()
    .from(physicalAssessments)
    .where(eq(physicalAssessments.studentId, studentId))
    .orderBy(desc(physicalAssessments.assessedAt))
    .limit(1);

  return NextResponse.json({
    ...student,
    // also expose snake_case aliases for the avaliacao/nova page which
    // reads either naming convention
    weight_kg: student.weightKg,
    height_cm: student.heightCm,
    birth_date: student.birthDate,
    healthProfile: healthProfile ?? null,
    trainingPreferences: trainingPrefs ?? null,
    latestAssessment: latestAssessment ?? null,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const auth = await getAuthenticatedProfessional();
  if (auth instanceof NextResponse) return auth;

  const { studentId } = params;
  const body = await request.json();

  const [existing] = await db
    .select({ id: students.id })
    .from(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.professionalId, auth.professionalId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "Aluno não encontrado." },
      { status: 404 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.birthDate !== undefined)
    updateData.birthDate = body.birthDate ? new Date(body.birthDate) : null;
  if (body.sex !== undefined) updateData.sex = body.sex;
  if (body.weightKg !== undefined) updateData.weightKg = body.weightKg;
  if (body.heightCm !== undefined) updateData.heightCm = body.heightCm;
  if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;

  const [updated] = await db
    .update(students)
    .set(updateData)
    .where(eq(students.id, studentId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const auth = await getAuthenticatedProfessional();
  if (auth instanceof NextResponse) return auth;

  const { studentId } = params;

  const [existing] = await db
    .select({ id: students.id })
    .from(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.professionalId, auth.professionalId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "Aluno não encontrado." },
      { status: 404 }
    );
  }

  // Soft delete
  await db
    .update(students)
    .set({ deletedAt: new Date() })
    .where(eq(students.id, studentId));

  return NextResponse.json({ ok: true });
}
