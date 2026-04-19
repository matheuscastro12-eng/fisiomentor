import { z } from "zod";

// ── Etapa 1: Dados Pessoais ──
export const step1Schema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  sex: z.enum(["masculino", "feminino", "outro"], {
    required_error: "Selecione o sexo biológico",
  }),
  weightKg: z.coerce
    .number()
    .positive("Peso deve ser positivo")
    .max(500, "Peso inválido"),
  heightCm: z.coerce
    .number()
    .positive("Altura deve ser positiva")
    .max(300, "Altura inválida"),
});

// ── Etapa 2: Histórico Clínico ──
export const step2Schema = z.object({
  diagnoses: z.array(z.string()).default([]),
  injuries: z.string().default(""),
  surgeries: z
    .array(
      z.object({
        type: z.string().min(1, "Tipo da cirurgia é obrigatório"),
        date: z.string(),
        rehabilitationStatus: z.string(),
      })
    )
    .default([]),
});

// ── Etapa 3: Medicamentos e Risco ──
export const step3Schema = z.object({
  medications: z
    .array(
      z.object({
        name: z.string().min(1, "Nome do medicamento é obrigatório"),
        dosage: z.string(),
        condition: z.string(),
        schedule: z.string(),
      })
    )
    .default([]),
  parqResult: z
    .object({
      q1: z.boolean().default(false),
      q2: z.boolean().default(false),
      q3: z.boolean().default(false),
      q4: z.boolean().default(false),
      q5: z.boolean().default(false),
      q6: z.boolean().default(false),
      q7: z.boolean().default(false),
    })
    .default({}),
  cardiovascularRisk: z.enum(["baixo", "moderado", "alto"]).default("baixo"),
});

// ── Etapa 4: Perfil de Treino ──
export const step4Schema = z.object({
  experienceLevel: z.string().min(1, "Selecione o nível de experiência"),
  preferredModalities: z.array(z.string()).default([]),
  weeklySessions: z.coerce.number().int().min(1).max(7).default(3),
  minutesPerSession: z.coerce.number().int().min(30).max(90).default(60),
  goals: z.array(z.string()).min(1, "Selecione pelo menos um objetivo"),
});

// ── Etapa 5: Avaliação Física (opcional) ──
export const step5Schema = z.object({
  bodyFatPct: z.coerce.number().optional().or(z.literal("")),
  leanMassKg: z.coerce.number().optional().or(z.literal("")),
  bmi: z.coerce.number().optional().or(z.literal("")),
  fitnessTests: z
    .array(
      z.object({
        name: z.string(),
        result: z.string(),
        unit: z.string(),
      })
    )
    .default([]),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;

export type FullStudentFormData = Step1Data &
  Step2Data &
  Step3Data &
  Step4Data &
  Step5Data;

export const PARQ_QUESTIONS = [
  "Algum médico já disse que você possui algum problema cardíaco e recomendou atividades físicas apenas com supervisão médica?",
  "Você sente dor no peito quando pratica atividade física?",
  "No último mês, você sentiu dor no peito estando em repouso?",
  "Você apresenta desequilíbrio devido à tontura ou já perdeu a consciência?",
  "Você tem algum problema ósseo ou articular que poderia piorar com atividade física?",
  "Seu médico está prescrevendo medicamentos para pressão arterial ou coração?",
  "Você tem ciência de alguma outra razão pela qual não deveria praticar atividade física?",
];
