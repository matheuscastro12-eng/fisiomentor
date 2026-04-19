import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { students, healthProfiles, trainingPreferences } from "@/lib/db/schema";
import { getAuthenticatedProfessional } from "@/lib/auth-api";

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedProfessional();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();

  const result = await db.transaction(async (tx) => {
    const [student] = await tx
      .insert(students)
      .values({
        professionalId: auth.professionalId,
        name: body.name,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        sex: body.sex,
        weightKg: body.weightKg,
        heightCm: body.heightCm,
      })
      .returning();

    if (body.healthProfile) {
      await tx.insert(healthProfiles).values({
        studentId: student.id,
        ...body.healthProfile,
      });
    } else {
      await tx.insert(healthProfiles).values({ studentId: student.id });
    }

    if (body.trainingPrefs) {
      await tx.insert(trainingPreferences).values({
        studentId: student.id,
        ...body.trainingPrefs,
      });
    } else {
      await tx.insert(trainingPreferences).values({ studentId: student.id });
    }

    return student;
  });

  return NextResponse.json(result, { status: 201 });
}
