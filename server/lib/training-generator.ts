import { generateText } from "../../src/lib/ai/gemini";
import { searchContextForStudent } from "../../src/lib/ai/vector-store";
import {
  validatePlan,
  generateMonitoringNotes,
  type GeneratedPlan,
  type PatientProfile,
  type ValidationResult,
} from "./clinical-validator";

export interface GenerationInput {
  student: {
    name: string;
    age: number | null;
    sex: string | null;
    weightKg: number | null;
    heightCm: number | null;
  };
  healthProfile: {
    diagnoses: string[];
    medications: { name: string; dosage?: string; condition?: string; schedule?: string }[];
    injuries: string[];
    surgeries: { type: string; date?: string; rehabilitationStatus?: string }[];
    cardiovascularRisk: string;
    parqResult?: any;
  };
  trainingPrefs: {
    experienceLevel: string;
    preferredModalities: string[];
    weeklySessions: number;
    minutesPerSession: number;
    goals: string[];
  };
  physicalAssessment?: {
    bodyFatPct?: number;
    leanMassKg?: number;
    bmi?: number;
    fitnessTests?: any[];
  };
  professionalNotes?: string;
}

export interface GenerationOutput {
  plan: GeneratedPlan;
  restrictions: ValidationResult[];
  monitoringNotes: string[];
  ragSources: string[];
  summary: string;
}

/**
 * Motor principal de geração de treino com IA.
 *
 * Fluxo:
 * 1. Busca contexto RAG relevante para o perfil clínico
 * 2. Monta prompt com contexto + dados do paciente
 * 3. Gera plano via GPT-4o com structured output (JSON)
 * 4. Valida plano contra regras clínicas
 * 5. Gera notas de monitoramento
 * 6. Retorna plano + restrições + monitoramento
 */
export async function generateTrainingPlan(
  input: GenerationInput
): Promise<GenerationOutput> {
  // 1. Buscar contexto RAG
  const ragChunks = await searchContextForStudent({
    diagnoses: input.healthProfile.diagnoses,
    medications: input.healthProfile.medications.map((m) => m.name),
    goals: input.trainingPrefs.goals,
    experienceLevel: input.trainingPrefs.experienceLevel,
    cardiovascularRisk: input.healthProfile.cardiovascularRisk,
  });

  const ragContext = ragChunks
    .map(
      (c, i) =>
        `[Fonte ${i + 1}: ${c.source_name}]\n${c.content_chunk}`
    )
    .join("\n\n");

  const ragSources = Array.from(new Set(ragChunks.map((c) => c.source_name)));

  // 2. Montar prompt
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input, ragContext);

  // 3. Gerar plano via Gemini
  const responseText = await generateText({
    systemPrompt,
    userPrompt,
    temperature: 0.4,
    maxTokens: 4000,
  });

  const rawPlan = JSON.parse(responseText) as GeneratedPlan & { summary?: string };

  const plan: GeneratedPlan = {
    weekly_split: rawPlan.weekly_split ?? [],
  };

  // 4. Validar contra regras clínicas
  const patientProfile: PatientProfile = {
    diagnoses: input.healthProfile.diagnoses,
    medications: input.healthProfile.medications,
    cardiovascularRisk: input.healthProfile.cardiovascularRisk,
    injuries: input.healthProfile.injuries,
    surgeries: input.healthProfile.surgeries,
    age: input.student.age ?? undefined,
    bmi: input.physicalAssessment?.bmi ?? undefined,
  };

  const restrictions = validatePlan(plan, patientProfile);

  // 5. Gerar notas de monitoramento
  const monitoringNotes = generateMonitoringNotes(patientProfile);

  // 6. Gerar resumo
  const summary =
    rawPlan.summary ??
    `Plano de treino ${input.trainingPrefs.weeklySessions}x/semana para ${
      input.student.name
    } — ${input.trainingPrefs.goals.join(", ")}`;

  return {
    plan,
    restrictions,
    monitoringNotes,
    ragSources,
    summary,
  };
}

// ═══ PROMPTS ═══

function buildSystemPrompt(): string {
  return `Você é o FisioMentor, um sistema de prescrição de exercícios clínicos baseado em evidências.
Você é um motor de IA especializado em gerar planos de treino para profissionais de Educação Física
que atendem pacientes com condições clínicas especiais.

REGRAS OBRIGATÓRIAS:
1. Toda prescrição DEVE respeitar as diretrizes ACSM, OMS e posicionamentos das sociedades médicas relevantes.
2. Exercícios contraindicados para a condição do paciente NUNCA devem aparecer no plano.
3. Usar linguagem técnica profissional em português brasileiro.
4. Intensidade SEMPRE deve ser prescrita usando parâmetros mensuráveis (% 1RM, PSE Borg, zona de FC quando aplicável).
5. Cada exercício deve ter: nome, séries, repetições, tempo de descanso e orientação de carga.
6. Para pacientes com betabloqueadores, NUNCA usar FC alvo — usar apenas PSE (Borg).
7. Incluir aquecimento e volta à calma no plano.
8. A progressão deve ser conservadora para populações clínicas (máximo 5-10% por semana).

FORMATO DE SAÍDA (JSON estrito):
{
  "summary": "Resumo do plano em 1-2 frases",
  "weekly_split": [
    {
      "day": "Dia 1 — [foco muscular ou tipo]",
      "session_type": "[Musculação | Aeróbio | Funcional | Combinado]",
      "exercises": [
        {
          "name": "Nome do exercício",
          "sets": 3,
          "reps": "10-12",
          "rest_seconds": 60,
          "load_guidance": "60-70% 1RM ou PSE 12-13",
          "notes": "Observação opcional (ex: manter coluna neutra)"
        }
      ]
    }
  ]
}`;
}

function buildUserPrompt(input: GenerationInput, ragContext: string): string {
  const { student, healthProfile, trainingPrefs, physicalAssessment } = input;

  let prompt = `GERE UM PLANO DE TREINO para o seguinte paciente:\n\n`;

  // Dados do paciente
  prompt += `## DADOS DO PACIENTE\n`;
  prompt += `- Nome: ${student.name}\n`;
  if (student.age) prompt += `- Idade: ${student.age} anos\n`;
  if (student.sex) prompt += `- Sexo: ${student.sex}\n`;
  if (student.weightKg) prompt += `- Peso: ${student.weightKg} kg\n`;
  if (student.heightCm) prompt += `- Altura: ${student.heightCm} cm\n`;
  if (physicalAssessment?.bmi)
    prompt += `- IMC: ${physicalAssessment.bmi}\n`;
  if (physicalAssessment?.bodyFatPct)
    prompt += `- Gordura corporal: ${physicalAssessment.bodyFatPct}%\n`;
  if (physicalAssessment?.leanMassKg)
    prompt += `- Massa magra: ${physicalAssessment.leanMassKg} kg\n`;

  // Perfil clínico
  prompt += `\n## PERFIL CLÍNICO\n`;
  prompt += `- Diagnósticos: ${healthProfile.diagnoses.length > 0 ? healthProfile.diagnoses.join(", ") : "Nenhum"}\n`;
  prompt += `- Risco Cardiovascular: ${healthProfile.cardiovascularRisk || "Não avaliado"}\n`;
  if (healthProfile.injuries.length > 0)
    prompt += `- Lesões: ${healthProfile.injuries.join(", ")}\n`;
  if (healthProfile.surgeries.length > 0) {
    prompt += `- Cirurgias:\n`;
    healthProfile.surgeries.forEach((s) => {
      prompt += `  - ${s.type}${s.date ? ` (${s.date})` : ""}${s.rehabilitationStatus ? ` — ${s.rehabilitationStatus}` : ""}\n`;
    });
  }
  if (healthProfile.medications.length > 0) {
    prompt += `- Medicamentos:\n`;
    healthProfile.medications.forEach((m) => {
      prompt += `  - ${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.condition ? ` (para ${m.condition})` : ""}\n`;
    });
  }

  // Preferências de treino
  prompt += `\n## PREFERÊNCIAS DE TREINO\n`;
  prompt += `- Nível de experiência: ${trainingPrefs.experienceLevel}\n`;
  prompt += `- Frequência: ${trainingPrefs.weeklySessions}x/semana\n`;
  prompt += `- Duração por sessão: ${trainingPrefs.minutesPerSession} minutos\n`;
  prompt += `- Modalidades preferidas: ${trainingPrefs.preferredModalities.join(", ")}\n`;
  prompt += `- Objetivos: ${trainingPrefs.goals.join(", ")}\n`;

  // Notas do profissional
  if (input.professionalNotes) {
    prompt += `\n## OBSERVAÇÕES DO PROFISSIONAL\n${input.professionalNotes}\n`;
  }

  // Contexto RAG
  if (ragContext) {
    prompt += `\n## DIRETRIZES CLÍNICAS RELEVANTES (BASE DE EVIDÊNCIAS)\n`;
    prompt += `Use estas diretrizes para fundamentar sua prescrição:\n\n`;
    prompt += ragContext;
  }

  prompt += `\n\n## INSTRUÇÕES FINAIS\n`;
  prompt += `Gere exatamente ${trainingPrefs.weeklySessions} dias de treino.\n`;
  prompt += `Cada sessão deve ter duração total de aproximadamente ${trainingPrefs.minutesPerSession} minutos (incluindo aquecimento e volta à calma).\n`;
  prompt += `Retorne APENAS o JSON no formato especificado, sem texto adicional.`;

  return prompt;
}
