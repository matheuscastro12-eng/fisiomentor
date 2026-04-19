import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db";
import { professionals } from "../../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "../middleware/auth";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  cref: z.string().optional(),
  specialty: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  onboardingCompleted: z.boolean().optional(),
  preferences: z
    .object({
      defaultModality: z
        .enum(["musculacao", "aerobio", "ambos"])
        .optional(),
      planDetailLevel: z.enum(["sintetico", "detalhado"]).optional(),
      includeAssessmentProtocols: z.boolean().optional(),
    })
    .optional(),
});

export async function authRoutes(app: FastifyInstance) {
  // Get current professional profile
  app.get(
    "/professionals/me",
    { preHandler: [authenticate] },
    async (request) => {
      const [professional] = await db
        .select()
        .from(professionals)
        .where(eq(professionals.id, request.professionalId))
        .limit(1);

      return professional;
    }
  );

  // Update current professional profile
  app.patch(
    "/professionals/me",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = updateProfileSchema.parse(request.body);

      const [updated] = await db
        .update(professionals)
        .set({
          ...body,
          ...(body.preferences && {
            preferences: body.preferences,
          }),
        })
        .where(eq(professionals.id, request.professionalId))
        .returning();

      return updated;
    }
  );
}
