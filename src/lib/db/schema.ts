import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  real,
  varchar,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations, type InferSelectModel, type InferInsertModel } from "drizzle-orm";

/* ═══════════════════════════════════════════════
   PROFESSIONALS (Profissionais de Ed. Física)
   ═══════════════════════════════════════════════ */
export const professionals = pgTable("professionals", {
  id: uuid("id").defaultRandom().primaryKey(),
  authUserId: uuid("auth_user_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  cref: varchar("cref", { length: 20 }),
  specialty: text("specialty"),
  avatarUrl: text("avatar_url"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  preferences: jsonb("preferences").$type<ProfessionalPreferences>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ProfessionalPreferences = {
  defaultModality?: "musculacao" | "aerobio" | "ambos";
  planDetailLevel?: "sintetico" | "detalhado";
  includeAssessmentProtocols?: boolean;
};

/* ═══════════════════════════════════════════════
   STUDENTS (Alunos)
   ═══════════════════════════════════════════════ */
export const students = pgTable(
  "students",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => professionals.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    birthDate: timestamp("birth_date"),
    sex: varchar("sex", { length: 10 }),
    weightKg: real("weight_kg"),
    heightCm: real("height_cm"),
    avatarUrl: text("avatar_url"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    professionalIdx: index("students_professional_idx").on(table.professionalId),
  })
);

/* ═══════════════════════════════════════════════
   HEALTH PROFILES (Perfis de Saúde)
   ═══════════════════════════════════════════════ */
export const healthProfiles = pgTable("health_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .notNull()
    .unique()
    .references(() => students.id, { onDelete: "cascade" }),
  diagnoses: jsonb("diagnoses").$type<string[]>().default([]),
  surgeries: jsonb("surgeries").$type<Surgery[]>().default([]),
  medications: jsonb("medications").$type<Medication[]>().default([]),
  injuries: jsonb("injuries").$type<string[]>().default([]),
  parqResult: jsonb("parq_result").$type<Record<string, boolean>>(),
  cardiovascularRisk: varchar("cardiovascular_risk", { length: 20 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Surgery = {
  type: string;
  date: string;
  rehabilitationStatus: string;
};

export type Medication = {
  name: string;
  dosage: string;
  condition: string;
  schedule: string;
};

/* ═══════════════════════════════════════════════
   TRAINING PREFERENCES (Preferências de Treino)
   ═══════════════════════════════════════════════ */
export const trainingPreferences = pgTable("training_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .notNull()
    .unique()
    .references(() => students.id, { onDelete: "cascade" }),
  experienceLevel: varchar("experience_level", { length: 30 }),
  preferredModalities: jsonb("preferred_modalities").$type<string[]>().default([]),
  weeklySessions: integer("weekly_sessions"),
  minutesPerSession: integer("minutes_per_session"),
  goals: jsonb("goals").$type<string[]>().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ═══════════════════════════════════════════════
   PHYSICAL ASSESSMENTS (Avaliações Físicas)
   ═══════════════════════════════════════════════ */
export const physicalAssessments = pgTable(
  "physical_assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    bodyFatPct: real("body_fat_pct"),
    leanMassKg: real("lean_mass_kg"),
    bmi: real("bmi"),
    fitnessTests: jsonb("fitness_tests").$type<FitnessTest[]>().default([]),
    assessedAt: timestamp("assessed_at").defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => professionals.id),
  },
  (table) => ({
    studentIdx: index("assessments_student_idx").on(table.studentId),
  })
);

export type FitnessTest = {
  name: string;
  result: string;
  unit: string;
};

/* ═══════════════════════════════════════════════
   TRAINING PLANS (Planos de Treino)
   ═══════════════════════════════════════════════ */
export const trainingPlans = pgTable(
  "training_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => professionals.id),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    planData: jsonb("plan_data").$type<TrainingPlanData>(),
    planSummary: text("plan_summary"),
    restrictions: jsonb("restrictions").$type<Restriction[]>().default([]),
    monitoringNotes: jsonb("monitoring_notes").$type<string[]>().default([]),
    assessmentProtocols: jsonb("assessment_protocols").$type<string[]>().default([]),
    errorMessage: text("error_message"),
    generatedAt: timestamp("generated_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => ({
    studentIdx: index("plans_student_idx").on(table.studentId),
    statusIdx: index("plans_status_idx").on(table.status),
  })
);

export type TrainingPlanData = {
  plan_summary: string;
  weekly_split: WeeklySplit[];
};

export type WeeklySplit = {
  day: string;
  session_type: string;
  exercises: Exercise[];
};

export type Exercise = {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  load_guidance: string;
  notes?: string;
};

export type Restriction = {
  type: "red" | "yellow" | "green";
  description: string;
};

/* ═══════════════════════════════════════════════
   TRAINING SESSIONS (Sessões de Treino Registradas)
   ═══════════════════════════════════════════════ */
export const trainingSessions = pgTable(
  "training_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => trainingPlans.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    sessionDate: timestamp("session_date").defaultNow().notNull(),
    exercisesDone: jsonb("exercises_done").$type<ExerciseDone[]>().default([]),
    perceivedEffort: integer("perceived_effort"),
    observations: text("observations"),
    loggedBy: uuid("logged_by").references(() => professionals.id),
  },
  (table) => ({
    studentIdx: index("sessions_student_idx").on(table.studentId),
  })
);

export type ExerciseDone = {
  exerciseName: string;
  completed: boolean;
  loadUsed?: string;
  setsCompleted?: number;
  observation?: string;
};

/* ═══════════════════════════════════════════════
   PROGRESS RECORDS (Registros de Evolução)
   ═══════════════════════════════════════════════ */
export const progressRecords = pgTable(
  "progress_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    assessmentId: uuid("assessment_id").references(() => physicalAssessments.id),
    metricType: varchar("metric_type", { length: 50 }).notNull(),
    value: real("value").notNull(),
    unit: varchar("unit", { length: 30 }),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  },
  (table) => ({
    studentMetricIdx: index("progress_student_metric_idx").on(
      table.studentId,
      table.metricType
    ),
  })
);

/* ═══════════════════════════════════════════════
   KNOWLEDGE BASE (Base de Conhecimento RAG)
   ═══════════════════════════════════════════════ */
export const knowledgeBase = pgTable(
  "knowledge_base",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceName: text("source_name").notNull(),
    category: varchar("category", { length: 30 }).notNull(),
    contentHash: varchar("content_hash", { length: 32 }).notNull().unique(),
    contentChunk: text("content_chunk").notNull(),
    // embedding: vector(1536) — handled via raw SQL since drizzle doesn't have native vector support
    indexedAt: timestamp("indexed_at").defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("knowledge_category_idx").on(table.category),
  })
);

/* ═══════════════════════════════════════════════
   RELATIONS
   ═══════════════════════════════════════════════ */
export const professionalsRelations = relations(professionals, ({ many }) => ({
  students: many(students),
  trainingPlans: many(trainingPlans),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  professional: one(professionals, {
    fields: [students.professionalId],
    references: [professionals.id],
  }),
  healthProfile: one(healthProfiles),
  trainingPreferences: one(trainingPreferences),
  physicalAssessments: many(physicalAssessments),
  trainingPlans: many(trainingPlans),
  trainingSessions: many(trainingSessions),
  progressRecords: many(progressRecords),
}));

export const healthProfilesRelations = relations(healthProfiles, ({ one }) => ({
  student: one(students, {
    fields: [healthProfiles.studentId],
    references: [students.id],
  }),
}));

export const trainingPreferencesRelations = relations(trainingPreferences, ({ one }) => ({
  student: one(students, {
    fields: [trainingPreferences.studentId],
    references: [students.id],
  }),
}));

export const physicalAssessmentsRelations = relations(physicalAssessments, ({ one }) => ({
  student: one(students, {
    fields: [physicalAssessments.studentId],
    references: [students.id],
  }),
}));

export const trainingPlansRelations = relations(trainingPlans, ({ one, many }) => ({
  student: one(students, {
    fields: [trainingPlans.studentId],
    references: [students.id],
  }),
  professional: one(professionals, {
    fields: [trainingPlans.professionalId],
    references: [professionals.id],
  }),
  sessions: many(trainingSessions),
}));

export const trainingSessionsRelations = relations(trainingSessions, ({ one }) => ({
  plan: one(trainingPlans, {
    fields: [trainingSessions.planId],
    references: [trainingPlans.id],
  }),
  student: one(students, {
    fields: [trainingSessions.studentId],
    references: [students.id],
  }),
}));

export const progressRecordsRelations = relations(progressRecords, ({ one }) => ({
  student: one(students, {
    fields: [progressRecords.studentId],
    references: [students.id],
  }),
  assessment: one(physicalAssessments, {
    fields: [progressRecords.assessmentId],
    references: [physicalAssessments.id],
  }),
}));

/* ═══════════════════════════════════════════════
   EXPORTED TYPES
   ═══════════════════════════════════════════════ */
export type Professional = InferSelectModel<typeof professionals>;
export type NewProfessional = InferInsertModel<typeof professionals>;

export type Student = InferSelectModel<typeof students>;
export type NewStudent = InferInsertModel<typeof students>;

export type HealthProfile = InferSelectModel<typeof healthProfiles>;
export type NewHealthProfile = InferInsertModel<typeof healthProfiles>;

export type TrainingPreference = InferSelectModel<typeof trainingPreferences>;
export type NewTrainingPreference = InferInsertModel<typeof trainingPreferences>;

export type PhysicalAssessment = InferSelectModel<typeof physicalAssessments>;
export type NewPhysicalAssessment = InferInsertModel<typeof physicalAssessments>;

export type TrainingPlan = InferSelectModel<typeof trainingPlans>;
export type NewTrainingPlan = InferInsertModel<typeof trainingPlans>;

export type TrainingSession = InferSelectModel<typeof trainingSessions>;
export type NewTrainingSession = InferInsertModel<typeof trainingSessions>;

export type ProgressRecord = InferSelectModel<typeof progressRecords>;
export type NewProgressRecord = InferInsertModel<typeof progressRecords>;

export type KnowledgeBaseEntry = InferSelectModel<typeof knowledgeBase>;

/**
 * Student profile completo para o motor de IA
 */
export type StudentProfile = {
  student: Student;
  healthProfile: HealthProfile | null;
  trainingPreferences: TrainingPreference | null;
  latestAssessment: PhysicalAssessment | null;
};
