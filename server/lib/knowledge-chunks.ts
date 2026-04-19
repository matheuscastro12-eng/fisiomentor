/**
 * Base de conhecimento pré-compilada com diretrizes ACSM, OMS e evidências clínicas.
 * Cada chunk será indexado com embedding para busca vetorial RAG.
 *
 * Categorias:
 * - "acsm"       → Diretrizes do American College of Sports Medicine
 * - "oms"        → Recomendações da OMS/WHO
 * - "cardio"     → Condições cardiovasculares
 * - "metabolic"  → Diabetes, obesidade, síndrome metabólica
 * - "ortho"      → Ortopédicas, hérnias, pós-cirúrgicas
 * - "pulmonary"  → DPOC, asma e condições respiratórias
 * - "neuro"      → AVC, condições neurológicas
 * - "medication" → Interações medicamentosas com exercício
 * - "general"    → Princípios gerais de prescrição
 */

export interface KnowledgeEntry {
  source_name: string;
  category: string;
  content_chunk: string;
}

export const KNOWLEDGE_CHUNKS: KnowledgeEntry[] = [
  // ═══ ACSM Guidelines ═══
  {
    source_name: "ACSM Guidelines for Exercise Testing and Prescription (11th Ed)",
    category: "acsm",
    content_chunk:
      "Princípio FITT-VP para prescrição de exercício: Frequência (3-5x/semana para aeróbio, 2-3x/semana para resistido), Intensidade (moderada a vigorosa conforme limiar ventilatório ou FC reserva), Tempo (150-300 min/semana moderado ou 75-150 min/semana vigoroso), Tipo (aeróbio contínuo ou intervalado, resistido multiarticular), Volume (500-1000 MET-min/semana), Progressão (aumento de 5-10% por semana em volume/intensidade).",
  },
  {
    source_name: "ACSM Guidelines for Exercise Testing and Prescription (11th Ed)",
    category: "acsm",
    content_chunk:
      "Estratificação de risco pré-participação ACSM: Sem triagem médica adicional necessária para indivíduos assintomáticos com exercício de intensidade leve a moderada. Para intensidade vigorosa, avaliar fatores de risco cardiovascular (histórico familiar, tabagismo, hipertensão, dislipidemia, diabetes, obesidade, sedentarismo). Indivíduos com doença cardiovascular, metabólica ou renal conhecida devem obter liberação médica antes de iniciar programa vigoroso.",
  },
  {
    source_name: "ACSM Guidelines for Exercise Testing and Prescription (11th Ed)",
    category: "acsm",
    content_chunk:
      "Princípios de treinamento resistido ACSM: Iniciantes: 1-3 séries de 8-12 repetições a 60-70% 1RM, descanso 1-2 min. Intermediários: 3-4 séries de 6-12 reps a 70-85% 1RM, descanso 1-3 min. Avançados: 4-6 séries, periodização ondulada. Priorizar exercícios multiarticulares (agachamento, supino, remada). Progressão de carga quando conseguir completar todas as reps prescritas em duas sessões consecutivas.",
  },

  // ═══ OMS/WHO ═══
  {
    source_name: "OMS - Diretrizes sobre Atividade Física e Comportamento Sedentário (2020)",
    category: "oms",
    content_chunk:
      "Adultos (18-64 anos): mínimo 150-300 min/semana de atividade aeróbia moderada OU 75-150 min de vigorosa. Exercícios de fortalecimento muscular envolvendo grandes grupos musculares pelo menos 2x/semana. Limitar comportamento sedentário. Qualquer quantidade de atividade física é melhor que nenhuma. Acima de 300 min/semana oferece benefícios adicionais de saúde.",
  },
  {
    source_name: "OMS - Diretrizes sobre Atividade Física e Comportamento Sedentário (2020)",
    category: "oms",
    content_chunk:
      "Idosos (65+ anos): mesmas recomendações dos adultos, com adição de treino de equilíbrio funcional e prevenção de quedas pelo menos 3x/semana. Exercícios multicomponentes que incluam equilíbrio, força e aeróbio. Intensidade deve ser relativa à capacidade do indivíduo. Atividade física regular reduz risco de quedas, fraturas, declínio funcional e cognitivo.",
  },

  // ═══ Cardiovascular ═══
  {
    source_name: "AHA/ACSM Scientific Statement - Exercise for Cardiac Patients",
    category: "cardio",
    content_chunk:
      "Insuficiência Cardíaca (NYHA II-III): exercício aeróbio contínuo ou intervalado a 40-80% FC reserva, 3-5x/semana, 20-60 min. Iniciar com 40-50% FCR por 10-20 min. HIIT (4x4 min a 85-95% FCpico com 3 min recuperação ativa) seguro e eficaz em IC estável. Resistido a 40-60% 1RM, 1-3 séries de 10-15 reps. Contraindicações: IC descompensada, arritmia instável, estenose aórtica severa. Monitorar FC, PA, Borg (manter ≤14).",
  },
  {
    source_name: "AHA/ACSM Scientific Statement - Exercise for Cardiac Patients",
    category: "cardio",
    content_chunk:
      "Hipertensão Arterial: exercício aeróbio reduz PAS em 5-7 mmHg. Frequência: 5-7x/semana. Intensidade moderada (40-60% VO2R ou Borg 12-13). Tempo: 30-60 min contínuo ou acumulado. Resistido: 2-3x/semana a 60-80% 1RM, 2-4 séries de 8-12 reps. Evitar manobra de Valsalva. Não iniciar exercício se PAS ≥160 ou PAD ≥100 mmHg. Betabloqueadores atenuam resposta cronotrópica — usar percepção de esforço ao invés de FC alvo.",
  },
  {
    source_name: "ESC Guidelines - Sports Cardiology and Exercise in CVD",
    category: "cardio",
    content_chunk:
      "Cardiopatia Isquêmica estável: exercício aeróbio a 40-80% FCR, abaixo do limiar isquêmico (1 mm ST ou sintomas). Teste ergométrico prévio obrigatório. Resistido permitido a 40-60% 1RM após 3-4 semanas de aeróbio. Sinais de alerta: dor torácica, dispneia desproporcional, tontura, arritmia. Evitar: isométricos máximos, Valsalva, exercício em ambiente extremamente frio ou quente.",
  },

  // ═══ Metabólico ═══
  {
    source_name: "ADA/ACSM Joint Position Statement - Exercise and Type 2 Diabetes",
    category: "metabolic",
    content_chunk:
      "Diabetes Tipo 2: exercício aeróbio 150+ min/semana moderado ou 75 min/semana vigoroso, sem mais de 2 dias consecutivos sem exercício. Resistido: 2-3x/semana em dias não consecutivos. Combinação aeróbio + resistido é superior a qualquer um isolado. Monitorar glicemia pré e pós (risco de hipoglicemia com insulina/sulfonilureias). Evitar exercício se glicemia >250 mg/dL com cetonúria ou >300 mg/dL sem cetona. Se glicemia <100 mg/dL, ingerir 15-20g carboidrato antes.",
  },
  {
    source_name: "ADA/ACSM Joint Position Statement - Exercise and Type 2 Diabetes",
    category: "metabolic",
    content_chunk:
      "Diabetes Tipo 1: exercício reduz risco cardiovascular mas requer planejamento glicêmico cuidadoso. Reduzir insulina de ação rápida em 30-50% pré-exercício aeróbio. Exercício de alta intensidade/resistido pode causar hiperglicemia transitória. Monitoramento contínuo de glicose (CGM) recomendado. Ter carboidratos de rápida absorção disponíveis. Evitar exercício com glicemia >250 mg/dL + cetonas positivas.",
  },
  {
    source_name: "ACSM Position Stand - Exercise for Overweight and Obesity",
    category: "metabolic",
    content_chunk:
      "Obesidade (IMC ≥30): meta progressiva de 250-300 min/semana de exercício moderado para perda de peso significativa. Iniciar com 150 min/semana e progredir. Resistido: 2-3x/semana para preservação de massa magra durante déficit calórico. Considerar limitações articulares — preferir exercícios de baixo impacto (natação, ciclismo, elíptico). Progressão de carga conservadora (5% por semana). Avaliação postural prévia — adaptações biomecânicas necessárias.",
  },

  // ═══ Ortopédico / Pós-cirúrgico ═══
  {
    source_name: "ACSM Resource Manual - Musculoskeletal Conditions",
    category: "ortho",
    content_chunk:
      "Hérnia de disco lombar: EVITAR flexão lombar sob carga, rotação com carga, exercícios balísticos. Fase aguda: repouso ativo, caminhada. Fase subaguda: fortalecimento de core (prancha, bird-dog, dead bug — progressão de McGill). Fase crônica: reintroduzir agachamento parcial, leg press (ajustar ROM), remada horizontal. Sempre manter coluna neutra. Extensão lombar controlada pode ser terapêutica. Fortalecer glúteos e estabilizadores de quadril.",
  },
  {
    source_name: "ACSM Resource Manual - Musculoskeletal Conditions",
    category: "ortho",
    content_chunk:
      "Pós-artroplastia de joelho: fase 1 (0-6 sem): amplitude de movimento ativa-assistida, isométricos quadríceps, caminhada com andador. Fase 2 (6-12 sem): leg press parcial, agachamento na parede, bicicleta estacionária. Fase 3 (3-6 meses): resistido progressivo, equilíbrio unipodal, escada. EVITAR: saltos, corrida, pivô lateral até liberação ortopédica. Progressão guiada por dor (<3/10 durante exercício).",
  },
  {
    source_name: "ACSM Resource Manual - Rehabilitation",
    category: "ortho",
    content_chunk:
      "Pós-artroscopia de ombro/manguito rotador: respeitar protocolo cirúrgico (tipicamente 6 semanas de imobilização relativa). Fase 1: pendulares de Codman, isométricos suaves. Fase 2: amplitude ativa-assistida, elásticos em rotação interna/externa. Fase 3: fortalecimento progressivo deltóide/manguito. EVITAR: elevação acima de 90° nas fases iniciais, cargas pesadas em push/pull por 4-6 meses. Scapular stabilization é prioridade.",
  },

  // ═══ Pulmonar ═══
  {
    source_name: "ATS/ERS Statement - Pulmonary Rehabilitation",
    category: "pulmonary",
    content_chunk:
      "DPOC: exercício aeróbio a 60-80% da carga máxima em teste incremental, 3-5x/semana, 20-60 min. HIIT (30s esforço/30s descanso) pode ser melhor tolerado que contínuo em DPOC severa. Resistido: 2-3x/semana, 1-3 séries de 8-12 reps focando grandes grupos (quadríceps prioritário). Oximetria durante exercício — manter SpO2 ≥88%. Usar escala Borg modificada (0-10) para dispneia, manter ≤5. Técnicas respiratórias: lábios semicerrados durante esforço.",
  },

  // ═══ Neurológico ═══
  {
    source_name: "AHA/ASA Guidelines - Physical Activity After Stroke",
    category: "neuro",
    content_chunk:
      "Pós-AVC: exercício aeróbio inicia 1-3 meses pós-evento (após liberação médica). 3-5x/semana, 20-60 min a 40-70% FCR. Tipo: caminhada, bicicleta, treino em circuito adaptado. Resistido: 2-3x/semana, 1-3 séries de 10-15 reps a 50-70% 1RM. Priorizar lado hemiparético — exercícios unilaterais e bilaterais. Treino de equilíbrio e marcha são essenciais. Supervisão direta recomendada. Atenção a: espasticidade, fadiga precoce, deficit proprioceptivo.",
  },

  // ═══ Interações Medicamentosas ═══
  {
    source_name: "ACSM Clinical Exercise Physiology - Pharmacology",
    category: "medication",
    content_chunk:
      "Betabloqueadores (atenolol, propranolol, metoprolol): atenuam resposta de FC ao exercício. NÃO usar FC alvo convencional. Usar escala de Borg (12-14) ou teste de fala para dosagem de intensidade. FC máxima pode ser 20-30 bpm menor. Efeitos: hipotensão pós-exercício mais pronunciada, broncoespasmo em asmáticos (beta-1 não seletivos). Hidratação adequada, aquecimento prolongado.",
  },
  {
    source_name: "ACSM Clinical Exercise Physiology - Pharmacology",
    category: "medication",
    content_chunk:
      "Insulina e Hipoglicemiantes Orais: risco de hipoglicemia durante e até 24h pós-exercício. Sulfonilureias (glibenclamida, glimepirida) — maior risco. Metformina isolada — baixo risco de hipo. Ajustar horário do exercício em relação às refeições e medicação. Monitorar sinais: tremor, sudorese, confusão, palidez. Ter glicose rápida disponível. Exercício matinal em jejum: especialmente arriscado com insulina/sulfonilureia.",
  },
  {
    source_name: "ACSM Clinical Exercise Physiology - Pharmacology",
    category: "medication",
    content_chunk:
      "Estatinas (atorvastatina, sinvastatina, rosuvastatina): podem causar mialgia e rabdomiólise. Monitorar dor muscular e fraqueza inexplicada. Se CK >10x normal, suspender exercício e encaminhar. Exercício excêntrico intenso pode exacerbar miotoxicidade. Progressão de volume muito gradual. Hidratação reforçada. Anti-hipertensivos (IECA/BRA): podem causar hipotensão durante exercício — levantar devagar, evitar mudanças posturais bruscas.",
  },
  {
    source_name: "ACSM Clinical Exercise Physiology - Pharmacology",
    category: "medication",
    content_chunk:
      "Corticosteroides (prednisona, dexametasona): uso crônico causa miopatia, osteoporose, hiperglicemia. Priorizar exercícios de fortalecimento e impacto controlado para proteção óssea. Monitorar glicemia em diabéticos. Anticoagulantes (varfarina, rivaroxabana): evitar esportes de contato e alto risco de queda/trauma. Exercícios de baixo impacto preferidos. Broncodilatadores (salbutamol): usar 15-30 min antes do exercício se asma induzida por esforço.",
  },

  // ═══ Princípios Gerais ═══
  {
    source_name: "ACSM Guidelines - General Principles",
    category: "general",
    content_chunk:
      "Princípio da individualização: a prescrição deve considerar idade, sexo, condição clínica, nível de condicionamento, objetivos e preferências pessoais. Princípio da sobrecarga progressiva: aumento gradual de volume, intensidade ou frequência (máximo 10% por semana). Princípio da especificidade: o treino deve ser direcionado ao objetivo. Princípio da reversibilidade: benefícios são perdidos com a interrupção. Periodização: alternar fases de intensidade para evitar estagnação e overtraining.",
  },
  {
    source_name: "ACSM Guidelines - General Principles",
    category: "general",
    content_chunk:
      "Aquecimento: 5-10 min de atividade aeróbia leve + mobilidade articular dinâmica. Volta à calma: 5-10 min de caminhada leve + alongamento estático. Em pacientes cardíacos, a volta à calma é CRÍTICA — mudança brusca pode causar arritmia ou hipotensão. Hidratação: 400-600ml 2h antes, 150-350ml a cada 15-20 min durante, reposição pós-exercício de 150% do peso perdido. Em clima quente: maior atenção a hipertermia em obesos, idosos e cardiopatas.",
  },
  {
    source_name: "ACSM Guidelines - General Principles",
    category: "general",
    content_chunk:
      "Escala de Borg (PSE 6-20): 6-7 muito leve, 9-10 leve, 12-13 moderado (zona aeróbia), 14-16 intenso (limiar anaeróbio), 17-19 muito intenso, 20 máximo. Para a maioria das populações clínicas, manter entre 11-14. Teste da fala: conseguir conversar = moderado, falar entrecortado = vigoroso, não conseguir falar = máximo. Em pacientes com betabloqueador ou marca-passo, usar exclusivamente PSE ou teste da fala.",
  },
];
