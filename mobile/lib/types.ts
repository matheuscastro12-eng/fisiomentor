/**
 * Shared TypeScript types for FisioMentor mobile app
 */

export interface Student {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  gender: "M" | "F" | "Other";
  healthProfile: HealthProfile;
  trainingPreferences: TrainingPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface HealthProfile {
  height: number;
  weight: number;
  bmIndex?: number;
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  injuries: Injury[];
  limitations: string[];
}

export interface Injury {
  name: string;
  date: string;
  severity: "mild" | "moderate" | "severe";
  status: "healing" | "recovered" | "chronic";
  notes?: string;
}

export interface TrainingPreferences {
  availableDays: string[];
  preferredTimeSlot: "morning" | "afternoon" | "evening";
  sessionDuration: number;
  goals: string[];
  equipment: string[];
  restrictions: string[];
}

export interface PhysicalAssessment {
  id: string;
  studentId: string;
  date: string;
  assessmentType: string;
  measurements: Record<string, number>;
  tests: FitnessTest[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FitnessTest {
  name: string;
  value: number;
  unit: string;
  normalRange?: {
    min: number;
    max: number;
  };
}

export interface TrainingPlan {
  id: string;
  studentId: string;
  title: string;
  description: string;
  duration: number;
  durationUnit: "days" | "weeks" | "months";
  startDate: string;
  endDate: string;
  phases: TrainingPhase[];
  objectives: string[];
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPhase {
  id: string;
  name: string;
  duration: number;
  durationUnit: "days" | "weeks";
  weeks: TrainingWeek[];
  objectives: string[];
  focusAreas: string[];
}

export interface TrainingWeek {
  id: string;
  weekNumber: number;
  sessions: TrainingSession[];
  notes?: string;
}

export interface TrainingSession {
  id: string;
  name: string;
  dayOfWeek: string;
  duration: number;
  type: "strength" | "cardio" | "flexibility" | "mobility" | "mixed";
  exercises: Exercise[];
  warmup?: string;
  cooldown?: string;
  notes?: string;
  progression?: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  duration?: string;
  intensity: "light" | "moderate" | "high";
  rest: number;
  form?: string;
  modifications?: string[];
  equipment?: string[];
  notes?: string;
}

export interface ProgressRecord {
  id: string;
  studentId: string;
  date: string;
  metric: string;
  value: number;
  unit: string;
  notes?: string;
  sessionId?: string;
  createdAt: string;
}

export interface TrainingSessionLog {
  id: string;
  studentId: string;
  sessionId: string;
  date: string;
  completed: boolean;
  duration: number;
  notes?: string;
  exerciseLogs: ExerciseLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseLog {
  exerciseId: string;
  name: string;
  setsCompleted: number;
  repsAchieved: string;
  weight?: number;
  duration?: string;
  notes?: string;
  difficulty: "easy" | "moderate" | "hard";
}

export interface Assessment {
  id: string;
  studentId: string;
  type: string;
  date: string;
  measurements: Record<string, number | string>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
