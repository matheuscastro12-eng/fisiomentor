import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db";
import {
  trainingSessions,
  progressRecords,
  trainingPlans,
  physicalAssessments,
  students,
} from "../../src/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { authenticate } from "../middleware/auth";

const createSessionSchema = z.object({
  planId: z.string().uuid(),
  sessionDate: z.string().optional(),
  exercisesDone: z
    .array(
      z.object({
        exerciseName: z.string(),
        completed: z.boolean(),
        loadUsed: z.string().optional(),
        setsCompleted: z.number().optional(),
        repsCompleted: z.string().optional(),
        observation: z.string().optional(),
      })
    )
    .default([]),
  perceivedEffort: z.number().int().min(6).max(20).optional(),
  observations: z.string().optional(),
});

const createProgressRecordSchema = z.object({
  metricType: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  assessmentId: z.string().uuid().optional(),
});

export async function progressRoutes(app: FastifyInstance) {
  // ─── CREATE training session (registro de treino realizado) ───
  app.post(
    "/training-sessions",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = createSessionSchema.parse(request.body);

      // Buscar studentId a partir do plano
      const [plan] = await db
        .select({ studentId: trainingPlans.studentId })
        .from(trainingPlans)
        .where(
          and(
            eq(trainingPlans.id, body.planId),
            eq(trainingPlans.professionalId, request.professionalId)
          )
        )
        .limit(1);

      if (!plan) {
        return reply.status(404).send({ error: "Plano não encontrado." });
      }

      const [session] = await db
        .insert(trainingSessions)
        .values({
          planId: body.planId,
          studentId: plan.studentId,
          sessionDate: body.sessionDate
            ? new Date(body.sessionDate)
            : new Date(),
          exercisesDone: body.exercisesDone,
          perceivedEffort: body.perceivedEffort,
          observations: body.observations,
          loggedBy: request.professionalId,
        })
        .returning();

      return reply.status(201).send(session);
    }
  );

  // ─── LIST sessions for a student ───
  app.get(
    "/students/:studentId/sessions",
    { preHandler: [authenticate] },
    async (request) => {
      const { studentId } = request.params as { studentId: string };
      const { limit: limitStr } = request.query as { limit?: string };
      const limitNum = limitStr ? parseInt(limitStr) : 20;

      const sessions = await db
        .select()
        .from(trainingSessions)
        .where(eq(trainingSessions.studentId, studentId))
        .orderBy(desc(trainingSessions.sessionDate))
        .limit(limitNum);

      return sessions;
    }
  );

  // ─── CREATE progress record (medição avulsa) ───
  app.post(
    "/students/:studentId/progress",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { studentId } = request.params as { studentId: string };
      const body = createProgressRecordSchema.parse(request.body);

      // Verificar ownership
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

      const [record] = await db
        .insert(progressRecords)
        .values({
          studentId,
          metricType: body.metricType,
          value: body.value,
          unit: body.unit,
          assessmentId: body.assessmentId,
        })
        .returning();

      return reply.status(201).send(record);
    }
  );

  // ─── GET progress data for charts ───
  app.get(
    "/students/:studentId/progress",
    { preHandler: [authenticate] },
    async (request) => {
      const { studentId } = request.params as { studentId: string };
      const { metric } = request.query as { metric?: string };

      const records = await db
        .select()
        .from(progressRecords)
        .where(eq(progressRecords.studentId, studentId))
        .orderBy(sql`recorded_at ASC`);

      if (metric) {
        return records.filter((r) => r.metricType === metric);
      }

      return records;
    }
  );

  // ─── GET progress summary (aggregated for dashboard) ───
  app.get(
    "/students/:studentId/progress/summary",
    { preHandler: [authenticate] },
    async (request) => {
      const { studentId } = request.params as { studentId: string };

      // Total de sessões realizadas
      const sessionCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(trainingSessions)
        .where(eq(trainingSessions.studentId, studentId));

      // Média de PSE (últimas 10 sessões)
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
      const avgPSE = pses.length > 0
        ? Math.round((pses.reduce((a, b) => a + b, 0) / pses.length) * 10) / 10
        : null;

      // Frequência semanal (últimas 4 semanas)
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

      const weeklyFrequency = recentAllSessions.length > 0
        ? Math.round((recentAllSessions.length / 4) * 10) / 10
        : 0;

      // Últimas avaliações físicas
      const assessments = await db
        .select()
        .from(physicalAssessments)
        .where(eq(physicalAssessments.studentId, studentId))
        .orderBy(desc(physicalAssessments.assessedAt))
        .limit(5);

      return {
        totalSessions: Number(sessionCount[0]?.count ?? 0),
        averagePSE: avgPSE,
        weeklyFrequency,
        lastSession: recentSessions[0]?.sessionDate ?? null,
        assessments,
      };
    }
  );
}
