import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/drizzle";
import { professionals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Helper to get authenticated professional ID from request.
 * Returns { professionalId } or a NextResponse error.
 */
export async function getAuthenticatedProfessional(): Promise<
  { professionalId: string } | NextResponse
> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [prof] = await db
    .select({ id: professionals.id })
    .from(professionals)
    .where(eq(professionals.authUserId, user.id))
    .limit(1);

  if (!prof) {
    return NextResponse.json(
      { error: "Profissional não encontrado." },
      { status: 404 }
    );
  }

  return { professionalId: prof.id };
}
