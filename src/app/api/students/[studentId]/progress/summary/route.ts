import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  trainingSessions,
  physicalAssessments,
  students,
} from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
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

  const sessionCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(trainingSessions)
    .where(eq(trainingSessions.studentId, studentId));

  const recentSessions = await db
    .select({
      perceivedEffort: trainingSessions.perceivedEffort,
      sessionDate: trainingSessions.sessionDate,
    })
    .from(trainingSessions)
    .where(eq(trainingSessions.studentId, studentId))
    .orderBy(desc(trainingSessions.sessionDate))
    .limit(10);

  const pses = recentSessions
    .filter((s) => s.perceivedEffort != null)
    .map((s) => s.perceivedEffort!);
  const avgPSE =
    pses.length > 0
      ? Math.round((pses.reduce((a, b) => a + b, 0) / pses.length) * 10) / 10
      : null;

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const recentAllSessions = await db
    .select({ sessionDate: trainingSessions.sessionDate })
    .from(trainingSessions)
    .where(
      and(
        eq(trainingSessions.studentId, studentId),
        sql`session_date >= ${fourWeeksAgo.toISOString()}`
      )
    );

  const weeklyFrequency =
    recentAllSessions.length > 0
      ? Math.round((recentAllSessions.length / 4) * 10) / 10
      : 0;

  const assessments = await db
    .select()
    .from(physicalAssessments)
    .where(eq(physicalAssessments.studentId, studentId))
    .orderBy(desc(physicalAssessments.assessedAt))
    .limit(5);

  return NextResponse.json({
    totalSessions: Number(sessionCount[0]?.count ?? 0),
    averagePSE: avgPSE,
    weeklyFrequency,
    lastSession: recentSessions[0]?.sessionDate ?? null,
    assessments,
  });
}
