-- ══════════════════════════════════════════════════════════
-- FisioMentor — Script de criação de tabelas
-- Cole este SQL inteiro no SQL Editor do Supabase e execute
-- ══════════════════════════════════════════════════════════

-- Habilitar extensão pgvector para embeddings RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- ──────────────────────────────────────
-- PROFESSIONALS (Profissionais de Ed. Física)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cref VARCHAR(20),
  specialty TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ──────────────────────────────────────
-- STUDENTS (Alunos)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date TIMESTAMPTZ,
  sex VARCHAR(10),
  weight_kg REAL,
  height_cm REAL,
  avatar_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS students_professional_idx ON students(professional_id);

-- ──────────────────────────────────────
-- HEALTH PROFILES (Perfis de Saúde)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  diagnoses JSONB DEFAULT '[]',
  surgeries JSONB DEFAULT '[]',
  medications JSONB DEFAULT '[]',
  injuries JSONB DEFAULT '[]',
  parq_result JSONB,
  cardiovascular_risk VARCHAR(20),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ──────────────────────────────────────
-- TRAINING PREFERENCES (Preferências de Treino)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  experience_level VARCHAR(30),
  preferred_modalities JSONB DEFAULT '[]',
  weekly_sessions INTEGER,
  minutes_per_session INTEGER,
  goals JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ──────────────────────────────────────
-- PHYSICAL ASSESSMENTS (Avaliações Físicas)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS physical_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  body_fat_pct REAL,
  lean_mass_kg REAL,
  bmi REAL,
  fitness_tests JSONB DEFAULT '[]',
  assessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES professionals(id)
);
CREATE INDEX IF NOT EXISTS assessments_student_idx ON physical_assessments(student_id);

-- ──────────────────────────────────────
-- TRAINING PLANS (Planos de Treino)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  plan_data JSONB,
  plan_summary TEXT,
  restrictions JSONB DEFAULT '[]',
  monitoring_notes JSONB DEFAULT '[]',
  assessment_protocols JSONB DEFAULT '[]',
  error_message TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS plans_student_idx ON training_plans(student_id);
CREATE INDEX IF NOT EXISTS plans_status_idx ON training_plans(status);

-- ──────────────────────────────────────
-- TRAINING SESSIONS (Sessões de Treino Registradas)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES training_plans(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  exercises_done JSONB DEFAULT '[]',
  perceived_effort INTEGER,
  observations TEXT,
  logged_by UUID REFERENCES professionals(id)
);
CREATE INDEX IF NOT EXISTS sessions_student_idx ON training_sessions(student_id);

-- ──────────────────────────────────────
-- PROGRESS RECORDS (Registros de Evolução)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES physical_assessments(id),
  metric_type VARCHAR(50) NOT NULL,
  value REAL NOT NULL,
  unit VARCHAR(30),
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS progress_student_metric_idx ON progress_records(student_id, metric_type);

-- ──────────────────────────────────────
-- KNOWLEDGE BASE (Base de Conhecimento RAG)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL,
  category VARCHAR(30) NOT NULL,
  content_hash VARCHAR(32) NOT NULL UNIQUE,
  content_chunk TEXT NOT NULL,
  embedding VECTOR(768),
  indexed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS knowledge_category_idx ON knowledge_base(category);

-- Índice para busca vetorial por similaridade coseno
CREATE INDEX IF NOT EXISTS knowledge_embedding_idx
  ON knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ──────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────
-- Habilitar RLS em todas as tabelas
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Profissionais: podem ver/editar apenas seu próprio perfil
CREATE POLICY "professionals_own" ON professionals
  FOR ALL USING (auth_user_id = auth.uid());

-- Permitir INSERT para novos cadastros (o auth.uid() ainda não tem professional)
CREATE POLICY "professionals_insert" ON professionals
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Alunos: profissional vê apenas seus próprios alunos
CREATE POLICY "students_own" ON students
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM professionals WHERE auth_user_id = auth.uid()
    )
  );

-- Health profiles: via student ownership
CREATE POLICY "health_profiles_own" ON health_profiles
  FOR ALL USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN professionals p ON p.id = s.professional_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- Training preferences: via student ownership
CREATE POLICY "training_prefs_own" ON training_preferences
  FOR ALL USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN professionals p ON p.id = s.professional_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- Physical assessments: via student ownership
CREATE POLICY "assessments_own" ON physical_assessments
  FOR ALL USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN professionals p ON p.id = s.professional_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- Training plans: via professional ownership
CREATE POLICY "plans_own" ON training_plans
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM professionals WHERE auth_user_id = auth.uid()
    )
  );

-- Training sessions: via student ownership
CREATE POLICY "sessions_own" ON training_sessions
  FOR ALL USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN professionals p ON p.id = s.professional_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- Progress records: via student ownership
CREATE POLICY "progress_own" ON progress_records
  FOR ALL USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN professionals p ON p.id = s.professional_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- Knowledge base: leitura pública (diretrizes são públicas)
CREATE POLICY "knowledge_read" ON knowledge_base
  FOR SELECT USING (true);

-- ══════════════════════════════════════════════════════════
-- PRONTO! Todas as 9 tabelas foram criadas com RLS.
-- ══════════════════════════════════════════════════════════
