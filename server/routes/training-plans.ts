import type { FastifyInstance } from "fastify";
import { db } from "../lib/db";
import {
  trainingPlans,
  students,
  healthProfiles,
  trainingPreferences,
  physicalAssessments,
  professionals,
} from "../../src/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { authenticate } from "../middleware/auth";
import { generateTrainingPlan, type GenerationInput } from "../lib/training-generator";
import { calculateAge } from "../../src/lib/utils";
import { generatePlanPdfHtml } from "../lib/pdf-renderer";

export async function trainingPlanRoutes(app: FastifyInstance) {
  // ─── POST /api/students/:studentId/generate — Gerar plano com IA ───
  app.post(
    "/students/:studentId/generate",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { studentId } = request.params as { studentId: string };
      const { professionalNotes } = (request.body as any) ?? {};

      // 1. Buscar aluno com todas as relações
      const [student] = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.id, studentId),
            eq(students.professionalId, request.professionalId)
          )
        )
        .limit(1);

      if (!student) {
        return reply.status(404).send({ error: "Aluno não encontrado." });
      }

      const [healthProfile] = await db
        .select()
        .from(healthProfiles)
        .where(eq(healthProfiles.studentId, studentId))
        .limit(1);

      const [trainingPref] = await db
        .select()
        .from(trainingPreferences)
        .where(eq(trainingPreferences.studentId, studentId))
        .limit(1);

      const [assessment] = await db
        .select()
        .from(physicalAssessments)
        .where(eq(physicalAssessments.studentId, studentId))
        .orderBy(desc(physicalAssessments.assessedAt))
        .limit(1);

      // 2. Criar registro pendente
      const [pendingPlan] = await db
        .insert(trainingPlans)
        .values({
          studentId,
          professionalId: request.professionalId,
          status: "processing",
        })
        .returning();

      try {
        // 3. Montar input de geração
        const input: GenerationInput = {
          student: {
            name: student.name,
            age: student.birthDate
              ? calculateAge(student.birthDate.toISOString())
              : null,
            sex: student.sex,
            weightKg: student.weightKg,
            heightCm: student.heightCm,
          },
          healthProfile: {
            diagnoses: (healthProfile?.diagnoses as string[]) ?? [],
            medications: (healthProfile?.medications as any[]) ?? [],
            injuries: (healthProfile?.injuries as string[]) ?? [],
            surgeries: (healthProfile?.surgeries as any[]) ?? [],
            cardiovascularRisk: healthProfile?.cardiovascularRisk ?? "baixo",
            parqResult: healthProfile?.parqResult,
          },
          trainingPrefs: {
            experienceLevel: trainingPref?.experienceLevel ?? "iniciante",
            preferredModalities:
              (trainingPref?.preferredModalities as string[]) ?? [],
            weeklySessions: trainingPref?.weeklySessions ?? 3,
            minutesPerSession: trainingPref?.minutesPerSession ?? 60,
            goals: (trainingPref?.goals as string[]) ?? [],
          },
          physicalAssessment: assessment
            ? {
                bodyFatPct: assessment.bodyFatPct ?? undefined,
                leanMassKg: assessment.leanMassKg ?? undefined,
                bmi: assessment.bmi ?? undefined,
                fitnessTests: (assessment.fitnessTests as any[]) ?? [],
              }
            : undefined,
          professionalNotes,
        };

        // 4. Gerar plano
        const result = await generateTrainingPlan(input);

        // 5. Atualizar registro com plano gerado
        await db
          .update(trainingPlans)
          .set({
            status: "active",
            planData: result.plan as any,
            planSummary: result.summary,
            restrictions: result.restrictions as any,
            monitoringNotes: result.monitoringNotes as any,
          })
          .where(eq(trainingPlans.id, pendingPlan.id));

        // 6. Arquivar plano ativo anterior (se existir)
        await db
          .update(trainingPlans)
          .set({ status: "archived" })
          .where(
            and(
              eq(trainingPlans.studentId, studentId),
              eq(trainingPlans.status, "active"),
              sql`id != ${pendingPlan.id}`
            )
          );

        return reply.send({
          id: pendingPlan.id,
          status: "active",
          plan: result.plan,
          summary: result.summary,
          restrictions: result.restrictions,
          monitoringNotes: result.monitoringNotes,
          ragSources: result.ragSources,
        });
      } catch (error: any) {
        // Marcar como falhou
        await db
          .update(trainingPlans)
          .set({
            status: "failed",
            errorMessage: error.message,
          })
          .where(eq(trainingPlans.id, pendingPlan.id));

        request.log.error(error);
        return reply.status(500).send({
          error: "Falha na geração do plano de treino.",
          details: error.message,
          planId: pendingPlan.id,
        });
      }
    }
  );

  // ─── GET single training plan ───
  app.get(
    "/training-plans/:planId",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { planId } = request.params as { planId: string };

      const [plan] = await db
        .select()
        .from(trainingPlans)
        .where(eq(trainingPlans.id, planId))
        .limit(1);

      if (!plan) {
        return reply
          .status(404)
          .send({ error: "Plano de treino não encontrado." });
      }

      // Verify ownership
      if (plan.professionalId !== request.professionalId) {
        return reply.status(403).send({ error: "Acesso não autorizado." });
      }

      return plan;
    }
  );

  // ─── GET training plan as printable HTML (for PDF export) ───
  app.get(
    "/training-plans/:planId/pdf",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { planId } = request.params as { planId: string };

      const [plan] = await db
        .select()
        .from(trainingPlans)
        .where(eq(trainingPlans.id, planId))
        .limit(1);

      if (!plan || plan.professionalId !== request.professionalId) {
        return reply.status(404).send({ error: "Plano não encontrado." });
      }

      // Fetch student
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, plan.studentId))
        .limit(1);

      // Fetch professional
      const [prof] = await db
        .select()
        .from(professionals)
        .where(eq(professionals.id, request.professionalId))
        .limit(1);

      // Fetch health profile for conditions
      const [hp] = await db
        .select()
        .from(healthProfiles)
        .where(eq(healthProfiles.studentId, plan.studentId))
        .limit(1);

      const html = generatePlanPdfHtml({
        professionalName: prof?.name ?? "",
        professionalCref: prof?.cref ?? null,
        studentName: student?.name ?? "",
        studentAge: student?.birthDate
          ? calculateAge(student.birthDate.toISOString())
          : null,
        studentConditions: (hp?.diagnoses as string[]) ?? [],
        planSummary: plan.planSummary,
        planData: plan.planData,
        restrictions: (plan.restrictions as any[]) ?? [],
        monitoringNotes: (plan.monitoringNotes as string[]) ?? [],
        assessmentProtocols: (plan.assessmentProtocols as string[]) ?? [],
        generatedAt: plan.generatedAt.toISOString(),
      });

      return reply
        .header("Content-Type", "text/html; charset=utf-8")
        .header(
          "Content-Disposition",
          `inline; filename="plano-treino-${student?.name?.replace(/\s+/g, "-").toLowerCase() ?? "aluno"}.html"`
        )
        .send(html);
    }
  );

  // ─── LIST training plans for a student ───
  app.get(
    "/students/:studentId/training-plans",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { studentId } = request.params as { studentId: string };

      // Verify student ownership
      const [student] = await db
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            eq(students.id, studentId),
            eq(students.professionalId, request.professionalId)
          )
        )
        .limit(1);

      if (!student) {
        return reply.status(404).send({ error: "Aluno não encontrado." });
      }

      const plans = await db
        .select({
          id: trainingPlans.id,
          status: trainingPlans.status,
          generatedAt: trainingPlans.generatedAt,
          planSummary: trainingPlans.planSummary,
        })
        .from(trainingPlans)
        .where(eq(trainingPlans.studentId, studentId))
        .orderBy(sql`generated_at DESC`);

      return plans;
    }
  );

  // ─── SOFT DELETE (archive) training plan ───
  app.delete(
    "/training-plans/:planId",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { planId } = request.params as { planId: string };

      const [plan] = await db
        .select()
        .from(trainingPlans)
        .where(eq(trainingPlans.id, planId))
        .limit(1);

      if (!plan) {
        return reply
          .status(404)
          .send({ error: "Plano de treino não encontrado." });
      }

      if (plan.professionalId !== request.professionalId) {
        return reply.status(403).send({ error: "Acesso não autorizado." });
      }

      await db
        .update(trainingPlans)
        .set({ status: "archived" })
        .where(eq(trainingPlans.id, planId));

      return { success: true, message: "Plano arquivado com sucesso." };
    }
  );
}
