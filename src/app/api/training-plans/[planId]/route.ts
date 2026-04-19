import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { trainingPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedProfessional } from "@/lib/auth-api";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  const auth = await getAuthenticatedProfessional();
  if (auth instanceof NextResponse) return auth;

  const { planId } = params;

  const [plan] = await db
    .select()
    .from(trainingPlans)
    .where(eq(trainingPlans.id, planId))
    .limit(1);

  if (!plan) {
    return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });
  }

  if (plan.professionalId !== auth.professionalId) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  await db
    .update(trainingPlans)
    .set({ status: "archived" })
    .where(eq(trainingPlans.id, planId));

  return NextResponse.json({ success: true });
}
