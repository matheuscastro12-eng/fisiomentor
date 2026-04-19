import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { trainingSessions, trainingPlans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedProfessional } from "@/lib/auth-api";

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedProfessional();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();

  const [plan] = await db
    .select({ studentId: trainingPlans.studentId })
    .from(trainingPlans)
    .where(
      and(
        eq(trainingPlans.id, body.planId),
        eq(trainingPlans.professionalId, auth.professionalId)
      )
    )
    .limit(1);

  if (!plan) {
    return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });
  }

  const [session] = await db
    .insert(trainingSessions)
    .values({
      planId: body.planId,
      studentId: plan.studentId,
      sessionDate: body.sessionDate ? new Date(body.sessionDate) : new Date(),
      exercisesDone: body.exercisesDone ?? [],
      perceivedEffort: body.perceivedEffort,
      observations: body.observations,
      loggedBy: auth.professionalId,
    })
    .returning();

  return NextResponse.json(session, { status: 201 });
}
