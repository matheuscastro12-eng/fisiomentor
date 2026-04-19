/**
 * Motor de Validação Clínica
 * Aplica regras baseadas em evidências para validar e ajustar planos de treino.
 * Cada regra é declarativa e rastreável à diretriz de origem.
 */

export interface ValidationRule {
  id: string;
  condition: string; // Diagnóstico ou condição que ativa a regra
  type: "red" | "yellow" | "green"; // Severidade: red=proibição, yellow=cautela, green=recomendação
  description: string;
  source: string;
  check: (plan: GeneratedPlan, profile: PatientProfile) => ValidationResult | null;
}

export interface ValidationResult {
  ruleId: string;
  type: "red" | "yellow" | "green";
  description: string;
  source: string;
  affectedExercises?: string[];
  suggestion?: string;
}

export interface PatientProfile {
  diagnoses: string[];
  medications: { name: string; dosage?: string; condition?: string }[];
  cardiovascularRisk: string;
  injuries: string[];
  surgeries: { type: string; date?: string; rehabilitationStatus?: string }[];
  age?: number;
  bmi?: number;
}

export interface GeneratedPlan {
  weekly_split: {
    day: string;
    session_type: string;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      rest_seconds: number;
      load_guidance: string;
      notes?: string;
    }[];
  }[];
}

// ═══ REGRAS DE VALIDAÇÃO CLÍNICA ═══

const VALIDATION_RULES: ValidationRule[] = [
  // ─── CARDIOVASCULAR ───
  {
    id: "cv-high-intensity",
    condition: "Cardiopatia",
    type: "red",
    description:
      "Pacientes cardiopatas NÃO devem realizar exercício isométrico máximo ou Valsalva. Manter PSE ≤14 (Borg).",
    source: "AHA/ACSM Scientific Statement",
    check: (plan, profile) => {
      if (!profile.diagnoses.some((d) => /cardio|insufici/i.test(d))) return null;
      const risky = plan.weekly_split.flatMap((day) =>
        day.exercises
          .filter(
            (ex) =>
              /leg press|agachamento pesado|deadlift|supino.*máximo/i.test(ex.name) &&
              parseInt(ex.reps) <= 3
          )
          .map((ex) => ex.name)
      );
      if (risky.length === 0) return null;
      return {
        ruleId: "cv-high-intensity",
        type: "red",
        description:
          "Exercícios com carga máxima (<3 reps) são contraindicados para cardiopatas.",
        source: "AHA/ACSM Scientific Statement",
        affectedExercises: risky,
        suggestion: "Substituir por 3 séries de 10-15 reps a 40-60% 1RM.",
      };
    },
  },
  {
    id: "cv-beta-blocker",
    condition: "Betabloqueador",
    type: "yellow",
    description:
      "Betabloqueadores atenuam FC — usar PSE ao invés de FC alvo.",
    source: "ACSM Clinical Exercise Physiology",
    check: (plan, profile) => {
      const betaBlockers = /atenolol|propranolol|metoprolol|carvedilol|bisoprolol/i;
      const hasBeta = profile.medications.some((m) => betaBlockers.test(m.name));
      if (!hasBeta) return null;
      const usesHR = plan.weekly_split.some((d) =>
        d.exercises.some(
          (ex) => /\bFC\b|freq.*card|bpm|heart rate/i.test(ex.notes ?? "")
        )
      );
      return {
        ruleId: "cv-beta-blocker",
        type: "yellow",
        description:
          "Paciente usa betabloqueador. Referências a FC alvo devem ser substituídas por PSE (Borg 12-14).",
        source: "ACSM Clinical Exercise Physiology - Pharmacology",
        suggestion: usesHR
          ? "Remover referências a FC alvo e usar 'Borg 12-14' como guia de intensidade."
          : "Verificar que orientações de intensidade usam PSE, não FC.",
      };
    },
  },
  {
    id: "cv-hypertension-valsalva",
    condition: "Hipertensão",
    type: "yellow",
    description:
      "Hipertensos devem evitar manobra de Valsalva. Não iniciar exercício se PAS ≥160 ou PAD ≥100.",
    source: "AHA/ACSM Scientific Statement",
    check: (plan, profile) => {
      if (!profile.diagnoses.some((d) => /hipertens/i.test(d))) return null;
      return {
        ruleId: "cv-hypertension-valsalva",
        type: "yellow",
        description:
          "Hipertensão: evitar Valsalva, verificar PA antes de iniciar. Orientar respiração contínua durante esforço.",
        source: "AHA/ACSM Scientific Statement",
        suggestion:
          "Adicionar nota: 'Verificar PA pré-treino. Não iniciar se PAS≥160 ou PAD≥100. Respirar continuamente.'",
      };
    },
  },

  // ─── METABÓLICO ───
  {
    id: "dm-hypoglycemia",
    condition: "Diabetes",
    type: "red",
    description:
      "Diabéticos com insulina/sulfonilureia: risco de hipoglicemia. Monitorar glicemia.",
    source: "ADA/ACSM Joint Position Statement",
    check: (plan, profile) => {
      const isDiabetic = profile.diagnoses.some((d) => /diabet/i.test(d));
      if (!isDiabetic) return null;
      const hypoDrugs = /insulina|glibenclamida|glimepirida|gliclazida|sulfonilur/i;
      const usesHypoDrug = profile.medications.some((m) =>
        hypoDrugs.test(m.name)
      );
      return {
        ruleId: "dm-hypoglycemia",
        type: usesHypoDrug ? "red" : "yellow",
        description: usesHypoDrug
          ? "Paciente diabético com medicação hipoglicemiante. OBRIGATÓRIO: monitorar glicemia pré/pós-treino, ter carboidrato rápido disponível."
          : "Paciente diabético: monitorar sinais de hipo/hiperglicemia durante sessão.",
        source: "ADA/ACSM Joint Position Statement",
        suggestion:
          "Adicionar nota: 'Verificar glicemia antes do treino. Se <100 mg/dL, ingerir 15-20g carboidrato. Se >250 mg/dL + cetona, não treinar.'",
      };
    },
  },

  // ─── ORTOPÉDICO ───
  {
    id: "hernia-flexion",
    condition: "Hérnia",
    type: "red",
    description:
      "Hérnia de disco: PROIBIDO flexão lombar sob carga e rotação com carga.",
    source: "ACSM Resource Manual - Musculoskeletal Conditions",
    check: (plan, profile) => {
      if (!profile.diagnoses.some((d) => /h[eé]rnia/i.test(d))) return null;
      const dangerous = plan.weekly_split.flatMap((day) =>
        day.exercises
          .filter((ex) =>
            /stiff|romeno|good morning|abdominal.*crunch|sit.?up|twist.*carga/i.test(
              ex.name
            )
          )
          .map((ex) => ex.name)
      );
      if (dangerous.length === 0) {
        return {
          ruleId: "hernia-flexion",
          type: "green",
          description:
            "Plano respeita restrição de hérnia discal. Priorizar core com coluna neutra (prancha, bird-dog, dead bug).",
          source: "ACSM Resource Manual",
        };
      }
      return {
        ruleId: "hernia-flexion",
        type: "red",
        description:
          "Exercícios com flexão lombar sob carga são contraindicados com hérnia discal.",
        source: "ACSM Resource Manual - Musculoskeletal Conditions",
        affectedExercises: dangerous,
        suggestion:
          "Substituir por exercícios de core com coluna neutra: prancha frontal, bird-dog, dead bug.",
      };
    },
  },

  // ─── PULMONAR ───
  {
    id: "dpoc-spo2",
    condition: "DPOC",
    type: "yellow",
    description:
      "DPOC: monitorar SpO2 ≥88%. Usar Borg modificada (0-10) para dispneia, manter ≤5.",
    source: "ATS/ERS Statement - Pulmonary Rehabilitation",
    check: (plan, profile) => {
      if (!profile.diagnoses.some((d) => /dpoc|enfisema|bronquit.*cr[oô]n/i.test(d)))
        return null;
      return {
        ruleId: "dpoc-spo2",
        type: "yellow",
        description:
          "Paciente com DPOC: monitorar oximetria durante exercício (SpO2 ≥88%). Usar lábios semicerrados durante esforço.",
        source: "ATS/ERS Statement - Pulmonary Rehabilitation",
        suggestion:
          "Adicionar nota: 'Medir SpO2 durante exercício. Se <88%, reduzir intensidade. Usar Borg dispneia ≤5/10.'",
      };
    },
  },

  // ─── NEUROLÓGICO ───
  {
    id: "avc-unilateral",
    condition: "AVC",
    type: "yellow",
    description:
      "Pós-AVC: priorizar lado hemiparético, treino de equilíbrio e marcha. Supervisão direta.",
    source: "AHA/ASA Guidelines",
    check: (plan, profile) => {
      if (!profile.diagnoses.some((d) => /avc|acidente vascular/i.test(d)))
        return null;
      return {
        ruleId: "avc-unilateral",
        type: "yellow",
        description:
          "Pós-AVC: incluir exercícios unilaterais para lado hemiparético, treino de equilíbrio e marcha. Supervisão direta recomendada.",
        source: "AHA/ASA Guidelines - Physical Activity After Stroke",
        suggestion:
          "Garantir que o plano inclui: exercícios unilaterais, equilíbrio (unipodal), marcha funcional.",
      };
    },
  },

  // ─── MEDICAMENTOS ───
  {
    id: "statin-myalgia",
    condition: "Estatina",
    type: "yellow",
    description:
      "Estatinas podem causar mialgia. Progressão de volume gradual, monitorar dor muscular.",
    source: "ACSM Clinical Exercise Physiology",
    check: (plan, profile) => {
      const statins = /atorvastatina|sinvastatina|rosuvastatina|pravastatina|estatina/i;
      if (!profile.medications.some((m) => statins.test(m.name))) return null;
      return {
        ruleId: "statin-myalgia",
        type: "yellow",
        description:
          "Paciente usa estatina: risco de mialgia e rabdomiólise. Progressão muito gradual, monitorar dor/fraqueza muscular.",
        source: "ACSM Clinical Exercise Physiology - Pharmacology",
        suggestion:
          "Limitar exercício excêntrico intenso. Aumentar carga máx 5%/semana. Se dor muscular persistente, encaminhar para dosagem de CK.",
      };
    },
  },

  // ─── IDADE ───
  {
    id: "elderly-balance",
    condition: "Idoso",
    type: "green",
    description:
      "Idosos (65+): incluir treino de equilíbrio e prevenção de quedas 3x/semana.",
    source: "OMS 2020",
    check: (plan, profile) => {
      if (!profile.age || profile.age < 65) return null;
      return {
        ruleId: "elderly-balance",
        type: "green",
        description:
          "Paciente com 65+ anos: incluir treino de equilíbrio funcional e prevenção de quedas pelo menos 3x/semana.",
        source: "OMS - Diretrizes sobre Atividade Física (2020)",
        suggestion:
          "Adicionar exercícios de equilíbrio: unipodal, tandem, step-ups lentos, levantamento de cadeira.",
      };
    },
  },

  // ─── OBESIDADE ───
  {
    id: "obesity-low-impact",
    condition: "Obesidade",
    type: "yellow",
    description:
      "Obesidade (IMC≥30): preferir exercícios de baixo impacto. Avaliação postural prévia.",
    source: "ACSM Position Stand",
    check: (plan, profile) => {
      const isObese =
        profile.diagnoses.some((d) => /obesid/i.test(d)) ||
        (profile.bmi && profile.bmi >= 30);
      if (!isObese) return null;
      const highImpact = plan.weekly_split.flatMap((day) =>
        day.exercises
          .filter((ex) => /corrida|salto|jump|pliom|burpee|box jump/i.test(ex.name))
          .map((ex) => ex.name)
      );
      if (highImpact.length === 0) return null;
      return {
        ruleId: "obesity-low-impact",
        type: "yellow",
        description:
          "Paciente obeso: exercícios de alto impacto podem sobrecarregar articulações.",
        source: "ACSM Position Stand - Exercise for Overweight and Obesity",
        affectedExercises: highImpact,
        suggestion:
          "Substituir por alternativas de baixo impacto: caminhada, bicicleta, elíptico, natação.",
      };
    },
  },
];

/**
 * Executa todas as regras de validação contra o plano gerado e perfil do paciente.
 * Retorna lista de alertas/restrições ordenados por severidade.
 */
export function validatePlan(
  plan: GeneratedPlan,
  profile: PatientProfile
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const rule of VALIDATION_RULES) {
    try {
      const result = rule.check(plan, profile);
      if (result) {
        results.push(result);
      }
    } catch (err) {
      console.error(`Erro na regra ${rule.id}:`, err);
    }
  }

  // Ordenar: red > yellow > green
  const priority = { red: 0, yellow: 1, green: 2 };
  return results.sort((a, b) => priority[a.type] - priority[b.type]);
}

/**
 * Gera notas de monitoramento baseadas no perfil clínico.
 */
export function generateMonitoringNotes(
  profile: PatientProfile
): string[] {
  const notes: string[] = [];

  if (profile.diagnoses.some((d) => /cardio|insufici/i.test(d))) {
    notes.push(
      "Monitorar FC, PA e PSE (Borg) antes, durante e após exercício."
    );
    notes.push(
      "Interromper imediatamente se: dor torácica, dispneia desproporcional, tontura ou arritmia."
    );
  }

  if (profile.diagnoses.some((d) => /hipertens/i.test(d))) {
    notes.push(
      "Verificar PA antes do treino. Não iniciar se PAS≥160 ou PAD≥100 mmHg."
    );
  }

  if (profile.diagnoses.some((d) => /diabet/i.test(d))) {
    notes.push(
      "Medir glicemia capilar pré e pós-treino. Ter 15-20g de carboidrato rápido disponível."
    );
  }

  if (profile.diagnoses.some((d) => /dpoc/i.test(d))) {
    notes.push(
      "Monitorar SpO2 durante exercício. Se <88%, reduzir intensidade. Usar lábios semicerrados."
    );
  }

  if (profile.age && profile.age >= 65) {
    notes.push(
      "Idoso: verificar equilíbrio antes de exercícios em pé. Disponibilizar apoio se necessário."
    );
  }

  if (
    profile.diagnoses.some((d) => /obesid/i.test(d)) ||
    (profile.bmi && profile.bmi >= 30)
  ) {
    notes.push(
      "Monitorar tolerância articular (joelhos, lombar). Reforçar hidratação."
    );
  }

  // Notas padrão
  notes.push("Aquecimento: 5-10 min aeróbio leve + mobilidade articular.");
  notes.push(
    "Volta à calma: 5-10 min de caminhada leve + alongamento estático."
  );

  return notes;
}
