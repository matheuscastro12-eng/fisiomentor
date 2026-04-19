import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { progressRecords, students } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getAuthenticatedProfessional } from "@/lib/auth-api";

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const auth = await getAuthenticatedProfessional();
  if (auth instanceof NextResponse) return auth;

  const { studentId } = params;

  // Verify that the student belongs to this professional
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

  const records = await db
    .select()
    .from(progressRecords)
    .where(eq(progressRecords.studentId, studentId))
    .orderBy(sql`recorded_at ASC`);

  return NextResponse.json(records);
}
