import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { trainingSessions, students } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthenticatedProfessional } from "@/lib/auth-api";

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const auth = await getAuthenticatedProfessional();
  if (auth instanceof NextResponse) return auth;

  const { studentId } = params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "20");

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

  const sessions = await db
    .select()
    .from(trainingSessions)
    .where(eq(trainingSessions.studentId, studentId))
    .orderBy(desc(trainingSessions.sessionDate))
    .limit(limit);

  return NextResponse.json(sessions);
}
