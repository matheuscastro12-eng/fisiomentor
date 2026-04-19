import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db";
import {
  students,
  healthProfiles,
  trainingPreferences,
  physicalAssessments,
  trainingPlans,
  progressRecords,
} from "../../src/lib/db/schema";
import { eq, and, isNull, ilike, sql, desc } from "drizzle-orm";
import { authenticate } from "../middleware/auth";

const createStudentSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  birthDate: z.string().optional(),
  sex: z.enum(["masculino", "feminino", "outro"]).optional(),
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  healthProfile: z
    .object({
      diagnoses: z.array(z.string()).default([]),
      surgeries: z.array(z.any()).default([]),
      medications: z.array(z.any()).default([]),
      injuries: z.array(z.string()).default([]),
      parqResult: z.record(z.boolean()).optional(),
      cardiovascularRisk: z.enum(["baixo", "moderado", "alto"]).optional(),
    })
    .optional(),
  trainingPrefs: z
    .object({
      experienceLevel: z.string().optional(),
      preferredModalities: z.array(z.string()).default([]),
      weeklySessions: z.number().int().min(1).max(7).optional(),
      minutesPerSession: z.number().int().min(15).max(180).optional(),
      goals: z.array(z.string()).default([]),
    })
    .optional(),
});

const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  birthDate: z.string().optional(),
  sex: z.enum(["masculino", "feminino", "outro"]).optional(),
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
});

const updateHealthSchema = z.object({
  diagnoses: z.array(z.string()).optional(),
  surgeries: z.array(z.any()).optional(),
  medications: z.array(z.any()).optional(),
  injuries: z.array(z.string()).optional(),
  parqResult: z.record(z.boolean()).optional(),
  cardiovascularRisk: z.enum(["baixo", "moderado", "alto"]).optional(),
});

const updatePreferencesSchema = z.object({
  experienceLevel: z.string().optional(),
  preferredModalities: z.array(z.string()).optional(),
  weeklySessions: z.number().int().min(1).max(7).optional(),
  minutesPerSession: z.number().int().min(15).max(180).optional(),
  goals: z.array(z.string()).optional(),
});

const createAssessmentSchema = z.object({
  weightKg: z.number().positive("Peso deve ser positivo").optional(),
  bodyFatPct: z.number().min(0).max(70).optional(),
  leanMassKg: z.number().positive().optional(),
  bmi: z.number().positive().optional(),
  fitnessTests: z
    .array(
      z.object({
        name: z.string().min(1, "Nome do teste é obrigatório"),
        result: z.string().min(1, "Resultado é obrigatório"),
        unit: z.string().min(1, "Unidade é obrigatória"),
      })
    )
    .default([]),
});

export async function studentRoutes(app: FastifyInstance) {
  // ─── LIST students ───
  app.get(
    "/students",
    { preHandler: [authenticate] },
    async (request) => {
      const { condition, search } = request.query as {
        condition?: string;
        search?: string;
      };

      let query = db
        .select()
        .from(students)
        .where(
          and(
            eq(students.professionalId, request.professionalId),
            isNull(students.deletedAt)
          )
        );

      const result = await query;

      // Filter by condition (client-side for simplicity with jsonb)
      let filtered = result;
      if (condition) {
        const studentIds = result.map((s) => s.id);
        const healthData = await db
          .select()
          .from(healthProfiles)
          .where(sql`${healthProfiles.studentId} = ANY(${studentIds})`);

        const matchingIds = new Set(
          healthData
            .filter((hp) =>
              (hp.diagnoses as string[])?.some((d) =>
                d.toLowerCase().includes(condition.toLowerCase())
              )
            )
            .map((hp) => hp.studentId)
        );

        filtered = result.filter((s) => matchingIds.has(s.id));
      }

      if (search) {
        filtered = filtered.filter((s) =>
          s.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      return filtered;
    }
  );

  // ─── CREATE student (with health profile + preferences in transaction) ───
  app.post(
    "/students",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = createStudentSchema.parse(request.body);

      const result = await db.transaction(async (tx) => {
        // 1. Create student
        const [student] = await tx
          .insert(students)
          .values({
            professionalId: request.professionalId,
            name: body.name,
            birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
            sex: body.sex,
            weightKg: body.weightKg,
            heightCm: body.heightCm,
          })
          .returning();

        // 2. Create health profile
        if (body.healthProfile) {
          await tx.insert(healthProfiles).values({
            studentId: student.id,
            ...body.healthProfile,
          });
        } else {
          await tx.insert(healthProfiles).values({
            studentId: student.id,
          });
        }

        // 3. Create training preferences
        if (body.trainingPrefs) {
          await tx.insert(trainingPreferences).values({
            studentId: student.id,
            ...body.trainingPrefs,
          });
        } else {
          await tx.insert(trainingPreferences).values({
            studentId: student.id,
          });
        }

        return student;
      });

      return reply.status(201).send(result);
    }
  );

  // ─── GET single student (with all related data) ───
  app.get(
    "/students/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const [student] = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.id, id),
            eq(students.professionalId, request.professionalId),
            isNull(students.deletedAt)
          )
        )
        .limit(1);

      if (!student) {
        return reply.status(404).send({ error: "Aluno não encontrado." });
      }

      const [healthProfile] = await db
        .select()
        .from(healthProfiles)
        .where(eq(healthProfiles.studentId, id))
        .limit(1);

      const [trainingPref] = await db
        .select()
        .from(trainingPreferences)
        .where(eq(trainingPreferences.studentId, id))
        .limit(1);

      const assessments = await db
        .select()
        .from(physicalAssessments)
        .where(eq(physicalAssessments.studentId, id))
        .orderBy(sql`assessed_at DESC`)
        .limit(5);

      const [lastPlan] = await db
        .select()
        .from(trainingPlans)
        .where(
          and(
            eq(trainingPlans.studentId, id),
            eq(trainingPlans.status, "active")
          )
        )
        .orderBy(sql`generated_at DESC`)
        .limit(1);

      return {
        ...student,
        healthProfile,
        trainingPreferences: trainingPref,
        physicalAssessments: assessments,
        lastTrainingPlan: lastPlan || null,
      };
    }
  );

  // ─── UPDATE student ───
  app.put(
    "/students/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateStudentSchema.parse(request.body);

      // Verify ownership
      const [existing] = await db
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            eq(students.id, id),
            eq(students.professionalId, request.professionalId)
          )
        )
        .limit(1);

      if (!existing) {
        return reply.status(404).send({ error: "Aluno não encontrado." });
      }

      const [updated] = await db
        .update(students)
        .set({
          ...body,
          ...(body.birthDate && { birthDate: new Date(body.birthDate) }),
        })
        .where(eq(students.id, id))
        .returning();

      return updated;
    }
  );

  // ─── UPDATE health profile ───
  app.put(
    "/students/:id/health",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateHealthSchema.parse(request.body);

      // Verify ownership
      const [existing] = await db
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            eq(students.id, id),
            eq(students.professionalId, request.professionalId)
          )
        )
        .limit(1);

      if (!existing) {
        return reply.status(404).send({ error: "Aluno não encontrado." });
      }

      const [updated] = await db
        .update(healthProfiles)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(healthProfiles.studentId, id))
        .returning();

      return updated;
    }
  );

  // ─── UPDATE training preferences ───
  app.put(
    "/students/:id/preferences",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updatePreferencesSchema.parse(request.body);

      const [existing] = await db
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            eq(students.id, id),
            eq(students.professionalId, request.professionalId)
          )
        )
        .limit(1);

      if (!existing) {
        return reply.status(404).send({ error: "Aluno não encontrado." });
      }

      const [updated] = await db
        .update(trainingPreferences)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(trainingPreferences.studentId, id))
        .returning();

      return updated;
    }
  );

  // ─── SOFT DELETE student ───
  app.delete(
    "/students/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const [existing] = await db
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            eq(students.id, id),
            eq(students.professionalId, request.professionalId)
          )
        )
        .limit(1);

      if (!existing) {
        return reply.status(404).send({ error: "Aluno não encontrado." });
      }

      await db
        .update(students)
        .set({ deletedAt: new Date() })
        .where(eq(students.id, id));

      return { success: true, message: "Aluno arquivado com sucesso." };
    }
  );

  // ─── CREATE physical assessment + progress_records ───
  app.post(
    "/students/:id/assessments",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = createAssessmentSchema.parse(request.body);

      const [existing] = await db
        .select({ id: students.id, weightKg: students.weightKg })
        .from(students)
        .where(
          and(
            eq(students.id, id),
            eq(students.professionalId, request.professionalId)
          )
        )
        .limit(1);

      if (!existing) {
        return reply.status(404).send({ error: "Aluno não encontrado." });
      }

      const result = await db.transaction(async (tx) => {
        // 1. Criar avaliação física
        const [assessment] = await tx
          .insert(physicalAssessments)
          .values({
            studentId: id,
            bodyFatPct: body.bodyFatPct,
            leanMassKg: body.leanMassKg,
            bmi: body.bmi,
            fitnessTests: body.fitnessTests,
            createdBy: request.professionalId,
          })
          .returning();

        // 2. Inserir cada métrica como progress_record
        const records: { studentId: string; assessmentId: string; metricType: string; value: number; unit?: string }[] = [];

        if (body.weightKg != null) {
          records.push({ studentId: id, assessmentId: assessment.id, metricType: "weight_kg", value: body.weightKg, unit: "kg" });
          // Atualizar peso do aluno
          await tx.update(students).set({ weightKg: body.weightKg }).where(eq(students.id, id));
        }
        if (body.bodyFatPct != null) {
          records.push({ studentId: id, assessmentId: assessment.id, metricType: "body_fat_pct", value: body.bodyFatPct, unit: "%" });
        }
        if (body.leanMassKg != null) {
          records.push({ studentId: id, assessmentId: assessment.id, metricType: "lean_mass_kg", value: body.leanMassKg, unit: "kg" });
        }
        if (body.bmi != null) {
          records.push({ studentId: id, assessmentId: assessment.id, metricType: "bmi", value: body.bmi });
        }

        // Testes físicos como progress_records individuais
        for (const test of body.fitnessTests) {
          const numVal = parseFloat(test.result);
          if (!isNaN(numVal)) {
            records.push({
              studentId: id,
              assessmentId: assessment.id,
              metricType: test.name.toLowerCase().replace(/\s+/g, "_"),
              value: numVal,
              unit: test.unit,
            });
          }
        }

        if (records.length > 0) {
          await tx.insert(progressRecords).values(records);
        }

        return assessment;
      });

      return reply.status(201).send(result);
    }
  );

  // ─── LIST assessments for a student ───
  app.get(
    "/students/:id/assessments",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      // Verificar ownership
      const [existing] = await db
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            eq(students.id, id),
            eq(students.professionalId, request.professionalId)
          )
        )
        .limit(1);

      if (!existing) {
        return reply.status(404).send({ error: "Aluno não encontrado." });
      }

      const assessments = await db
        .select()
        .from(physicalAssessments)
        .where(eq(physicalAssessments.studentId, id))
        .orderBy(sql`assessed_at DESC`);

      return assessments;
    }
  );
}
