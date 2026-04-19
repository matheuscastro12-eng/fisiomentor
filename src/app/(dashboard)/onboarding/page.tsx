"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  Brain,
  Target,
  UserPlus,
  CheckCircle2,
  Loader2,
  Sparkles,
  Shield,
  Activity,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const SPECIALTIES = [
  "Prescrição Clínica",
  "Treinamento Funcional",
  "Reabilitação",
  "Musculação",
  "Personal Trainer",
  "Pilates",
  "Outro",
];

const CONDITIONS = [
  "Diabetes T2",
  "Hipertensão",
  "Cardiopatia",
  "Obesidade",
  "Osteoporose",
  "Artrose",
  "DPOC",
  "Pós-cirúrgico",
];

const OBJECTIVES = [
  "Controle glicêmico",
  "Controle da PA",
  "Perda de peso",
  "Ganho de massa muscular",
  "Melhora da capacidade cardiorrespiratória",
  "Reabilitação",
  "Qualidade de vida",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Profile
  const [name, setName] = useState("");
  const [cref, setCref] = useState("");
  const [specialty, setSpecialty] = useState("");

  // Step 2: AI Preferences
  const [defaultModality, setDefaultModality] = useState("ambos");
  const [planDetailLevel, setPlanDetailLevel] = useState("detalhado");

  // Step 3: First student
  const [studentName, setStudentName] = useState("");
  const [studentAge, setStudentAge] = useState("");
  const [studentCondition, setStudentCondition] = useState("");
  const [studentObjective, setStudentObjective] = useState("");

  // API calls now go to Next.js Route Handlers (same origin)

  const handleComplete = async () => {
    setSaving(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. Update professional profile
      await supabase
        .from("professionals")
        .update({
          name: name || user?.user_metadata?.full_name || "Profissional",
          cref: cref || null,
          specialty: specialty || null,
          onboarding_completed: true,
          preferences: {
            defaultModality,
            planDetailLevel,
            includeAssessmentProtocols: true,
          },
        })
        .eq("auth_user_id", user?.id ?? "");

      // 2. If student data filled, create student and redirect to generation
      if (studentName.trim()) {
        const birthYear = studentAge
          ? new Date().getFullYear() - parseInt(studentAge)
          : null;

        const studentPayload: Record<string, unknown> = {
          name: studentName.trim(),
          ...(birthYear && {
            birthDate: `${birthYear}-01-01`,
          }),
          healthProfile: {
            diagnoses: studentCondition ? [studentCondition] : [],
          },
          trainingPrefs: {
            goals: studentObjective ? [studentObjective] : [],
            experienceLevel: "iniciante",
            weeklySessions: 3,
            minutesPerSession: 60,
            preferredModalities:
              defaultModality === "ambos"
                ? ["Musculação", "Aeróbio"]
                : [defaultModality === "musculacao" ? "Musculação" : "Aeróbio"],
          },
        };

        const res = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(studentPayload),
        });

        if (res.ok) {
          const student = await res.json();
          router.push(`/dashboard/alunos/${student.id}/gerar`);
          return;
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Erro no onboarding:", err);
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("professionals")
      .update({ onboarding_completed: true })
      .eq("auth_user_id", user?.id ?? "");

    router.push("/dashboard");
    router.refresh();
  };

  const TOTAL_STEPS = 4;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="bg-surface-container-low w-full max-w-lg">
        <CardContent className="pt-0 py-10 px-8">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {Array.from({ length: TOTAL_STEPS }).map((_, s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step
                    ? "w-8 bg-primary"
                    : s < step
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-surface-container-high"
                }`}
              />
            ))}
          </div>

          {/* ─── Step 0: Welcome ─── */}
          {step === 0 && (
            <div className="text-center">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Stethoscope className="h-10 w-10 text-primary" />
              </div>
              <h1 className="font-display text-headline-lg text-on-surface mb-3">
                Bem-vindo ao FisioMentor
              </h1>
              <p className="font-body text-body-lg text-on-surface-variant max-w-md mx-auto mb-8">
                Prescrição de treinos com IA para populações especiais, com
                segurança clínica.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-surface-container rounded-xl p-4 text-center">
                  <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-label-sm text-on-surface-variant">
                    Segurança clínica
                  </p>
                </div>
                <div className="bg-surface-container rounded-xl p-4 text-center">
                  <Brain className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-label-sm text-on-surface-variant">
                    IA baseada em evidências
                  </p>
                </div>
                <div className="bg-surface-container rounded-xl p-4 text-center">
                  <Activity className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-label-sm text-on-surface-variant">
                    Acompanhamento
                  </p>
                </div>
              </div>

              <Button onClick={() => setStep(1)} size="lg" className="gap-2">
                Começar
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* ─── Step 1: Profile ─── */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="font-display text-title-lg text-on-surface">
                  Complete seu Perfil
                </h2>
              </div>
              <div className="space-y-4">
                <Input
                  label="Nome Completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. João Silva"
                />
                <Input
                  label="CREF (opcional)"
                  value={cref}
                  onChange={(e) => setCref(e.target.value)}
                  placeholder="123456-G/SP"
                />
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-2">
                    Especialidade
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSpecialty(s)}
                        className={`px-4 py-2 rounded-xl text-body-sm font-medium transition-all ${
                          specialty === s
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
                <Button onClick={() => setStep(2)} className="gap-2">
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── Step 2: AI Preferences ─── */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Brain className="h-5 w-5 text-primary" />
                <h2 className="font-display text-title-lg text-on-surface">
                  Preferências de Geração
                </h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-2">
                    Modalidade padrão
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: "musculacao", label: "Musculação" },
                      { value: "aerobio", label: "Aeróbio" },
                      { value: "ambos", label: "Ambos" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDefaultModality(opt.value)}
                        className={`flex-1 px-4 py-3 rounded-xl text-body-sm font-medium transition-all ${
                          defaultModality === opt.value
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-2">
                    Nível de detalhamento
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPlanDetailLevel("sintetico")}
                      className={`flex-1 p-4 rounded-xl transition-all text-left ${
                        planDetailLevel === "sintetico"
                          ? "bg-primary/10 ring-2 ring-primary"
                          : "bg-surface-container hover:bg-surface-container-high"
                      }`}
                    >
                      <p className="text-body-sm text-on-surface font-medium">
                        Sintético
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        Exercícios essenciais, orientações concisas
                      </p>
                    </button>
                    <button
                      onClick={() => setPlanDetailLevel("detalhado")}
                      className={`flex-1 p-4 rounded-xl transition-all text-left ${
                        planDetailLevel === "detalhado"
                          ? "bg-primary/10 ring-2 ring-primary"
                          : "bg-surface-container hover:bg-surface-container-high"
                      }`}
                    >
                      <p className="text-body-sm text-on-surface font-medium">
                        Detalhado
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        Inclui notas, progressão e protocolos
                      </p>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
                <Button onClick={() => setStep(3)} className="gap-2">
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── Step 3: First Student ─── */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <h2 className="font-display text-title-lg text-on-surface">
                  Cadastre seu Primeiro Aluno
                </h2>
              </div>
              <p className="text-body-sm text-on-surface-variant mb-6">
                Preencha os dados básicos e gere o primeiro treino com IA.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-[2fr_1fr] gap-3">
                  <Input
                    label="Nome do aluno"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Maria da Silva"
                  />
                  <Input
                    label="Idade"
                    type="number"
                    value={studentAge}
                    onChange={(e) => setStudentAge(e.target.value)}
                    placeholder="58"
                    min={10}
                    max={120}
                  />
                </div>

                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-2">
                    Condição clínica principal
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CONDITIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() =>
                          setStudentCondition((prev) => (prev === c ? "" : c))
                        }
                        className={`px-3 py-1.5 rounded-full text-label-sm transition-all ${
                          studentCondition === c
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-2">
                    Objetivo principal
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {OBJECTIVES.map((o) => (
                      <button
                        key={o}
                        onClick={() =>
                          setStudentObjective((prev) => (prev === o ? "" : o))
                        }
                        className={`px-3 py-1.5 rounded-full text-label-sm transition-all ${
                          studentObjective === o
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleSkip}
                    disabled={saving}
                  >
                    Pular
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={saving || !studentName.trim()}
                    className="gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Gerar Meu Primeiro Treino
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
