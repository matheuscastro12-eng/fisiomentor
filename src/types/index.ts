/**
 * Re-export all types from the Drizzle schema
 * for use throughout the frontend application
 */
export type {
  Professional,
  NewProfessional,
  ProfessionalPreferences,
  Student,
  NewStudent,
  HealthProfile,
  NewHealthProfile,
  Surgery,
  Medication,
  TrainingPreference,
  NewTrainingPreference,
  PhysicalAssessment,
  NewPhysicalAssessment,
  FitnessTest,
  TrainingPlan,
  NewTrainingPlan,
  TrainingPlanData,
  WeeklySplit,
  Exercise,
  Restriction,
  TrainingSession,
  NewTrainingSession,
  ExerciseDone,
  ProgressRecord,
  NewProgressRecord,
  KnowledgeBaseEntry,
  StudentProfile,
} from "@/lib/db/schema";

/**
 * Training plan generation status
 */
export type PlanStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "active"
  | "archived";

/**
 * Student with related data (returned by API GET /students/:id)
 */
export interface StudentWithRelations {
  id: string;
  professionalId: string;
  name: string;
  birthDate: string | null;
  sex: string | null;
  weightKg: number | null;
  heightCm: number | null;
  avatarUrl: string | null;
  createdAt: string;
  healthProfile: {
    diagnoses: string[];
    surgeries: any[];
    medications: any[];
    injuries: string[];
    parqResult: Record<string, boolean> | null;
    cardiovascularRisk: string | null;
  } | null;
  trainingPreferences: {
    experienceLevel: string | null;
    preferredModalities: string[];
    weeklySessions: number | null;
    minutesPerSession: number | null;
    goals: string[];
  } | null;
  physicalAssessments: Array<{
    id: string;
    bodyFatPct: number | null;
    leanMassKg: number | null;
    bmi: number | null;
    fitnessTests: any[];
    assessedAt: string;
  }>;
  lastTrainingPlan: {
    id: string;
    status: string;
    planData: any;
    restrictions: any[];
    monitoringNotes: string[];
    generatedAt: string;
  } | null;
}

/**
 * Clinical condition severity levels
 */
export const CLINICAL_CONDITIONS = [
  { value: "Diabetes T1", label: "Diabetes Tipo I", severity: "yellow" },
  { value: "Diabetes T2", label: "Diabetes Tipo II", severity: "yellow" },
  { value: "Hipertensão", label: "Hipertensão", severity: "yellow" },
  { value: "Insuficiência Cardíaca", label: "Insuficiência Cardíaca", severity: "red" },
  { value: "Obesidade", label: "Obesidade", severity: "yellow" },
  { value: "Osteoporose", label: "Osteoporose", severity: "default" },
  { value: "Artrose", label: "Artrose", severity: "default" },
  { value: "DPOC", label: "DPOC", severity: "red" },
  { value: "AVC", label: "AVC", severity: "red" },
  { value: "Câncer em remissão", label: "Câncer em remissão", severity: "default" },
  { value: "Doença renal crônica", label: "Doença renal crônica", severity: "yellow" },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: "sedentario", label: "Sedentário" },
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
  { value: "atleta", label: "Atleta" },
] as const;

export const TRAINING_GOALS = [
  "Hipertrofia",
  "Emagrecimento",
  "Condicionamento Cardiovascular",
  "Reabilitação",
  "Manutenção Metabólica",
  "Ganho de Força",
  "Flexibilidade",
  "Equilíbrio e Propriocepção",
] as const;

export const MODALITIES = [
  "Musculação",
  "Exercício Aeróbio",
  "Funcional",
  "Pilates",
  "Hidroginástica",
  "Treinamento Resistido",
  "HIIT",
  "Yoga",
] as const;
