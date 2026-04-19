"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Step1Personal } from "./steps/step-1-personal";
import { Step2Clinical } from "./steps/step-2-clinical";
import { Step3Medications } from "./steps/step-3-medications";
import { Step4Training } from "./steps/step-4-training";
import { Step5Assessment } from "./steps/step-5-assessment";
import type { FullStudentFormData } from "@/lib/validations/student";

const STEP_LABELS = [
  "Dados Pessoais",
  "Histórico Clínico",
  "Medicamentos e Risco",
  "Perfil de Treino",
  "Avaliação Física",
];

const STORAGE_KEY = "fisiomentor_new_student_draft";

function loadDraft(): Partial<FullStudentFormData> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveDraft(data: Partial<FullStudentFormData>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearDraft() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export default function NewStudentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<FullStudentFormData>>(loadDraft);
  const [submitting, setSubmitting] = useState(false);
  const [stepValid, setStepValid] = useState(false);

  const updateFormData = useCallback(
    (stepData: Partial<FullStudentFormData>) => {
      setFormData((prev) => {
        const updated = { ...prev, ...stepData };
        saveDraft(updated);
        return updated;
      });
    },
    []
  );

  const goNext = () => {
    if (!stepValid) return;
    if (currentStep < 4) setCurrentStep((s) => s + 1);
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get professional_id
      const { data: professional } = await supabase
        .from("professionals")
        .select("id")
        .eq("auth_user_id", user?.id ?? "")
        .single();

      if (!professional) throw new Error("Profissional não encontrado");

      // 1. Create student
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert({
          professional_id: professional.id,
          name: formData.name,
          birth_date: formData.birthDate
            ? new Date(formData.birthDate).toISOString()
            : null,
          sex: formData.sex,
          weight_kg: formData.weightKg,
          height_cm: formData.heightCm,
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // 2. Create health profile
      await supabase.from("health_profiles").insert({
        student_id: student.id,
        diagnoses: formData.diagnoses ?? [],
        injuries: formData.injuries ? [formData.injuries] : [],
        surgeries: formData.surgeries ?? [],
        medications: formData.medications ?? [],
        parq_result: formData.parqResult ?? {},
        cardiovascular_risk: formData.cardiovascularRisk ?? "baixo",
      });

      // 3. Create training preferences
      await supabase.from("training_preferences").insert({
        student_id: student.id,
        experience_level: formData.experienceLevel,
        preferred_modalities: formData.preferredModalities ?? [],
        weekly_sessions: formData.weeklySessions ?? 3,
        minutes_per_session: formData.minutesPerSession ?? 60,
        goals: formData.goals ?? [],
      });

      // 4. Create physical assessment (if provided)
      const hasAssessment =
        formData.bodyFatPct || formData.leanMassKg || formData.bmi;
      if (hasAssessment) {
        await supabase.from("physical_assessments").insert({
          student_id: student.id,
          body_fat_pct: formData.bodyFatPct || null,
          lean_mass_kg: formData.leanMassKg || null,
          bmi: formData.bmi || null,
          fitness_tests: formData.fitnessTests ?? [],
          created_by: professional.id,
        });
      }

      clearDraft();
      router.push(`/dashboard/alunos/${student.id}`);
    } catch (err) {
      console.error("Erro ao cadastrar aluno:", err);
      alert("Erro ao cadastrar aluno. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const renderStep = () => {
    const props = { data: formData, onChange: updateFormData, onValidChange: setStepValid };
    switch (currentStep) {
      case 0: return <Step1Personal {...props} />;
      case 1: return <Step2Clinical {...props} />;
      case 2: return <Step3Medications {...props} />;
      case 3: return <Step4Training {...props} />;
      case 4: return <Step5Assessment {...props} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <h1 className="font-display text-headline-md text-on-surface">
          Cadastrar Novo Aluno
        </h1>
        <p className="font-body text-body-md text-on-surface-variant mt-1">
          Preencha os dados em 5 etapas para criar o perfil completo
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEP_LABELS.map((label, idx) => (
            <div
              key={label}
              className="flex items-center gap-2"
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-label-sm font-display transition-colors ${
                  idx < currentStep
                    ? "bg-primary text-primary-on"
                    : idx === currentStep
                    ? "bg-gradient-primary text-primary-on shadow-ambient"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {idx < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`hidden lg:inline text-label-sm font-body ${
                  idx <= currentStep
                    ? "text-on-surface"
                    : "text-on-surface-variant"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        {/* Progress bar line */}
        <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-primary rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card className="bg-surface-container-low mb-6">
        <CardContent className="pt-0">{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={goPrev}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Button>

        {currentStep < 4 ? (
          <Button onClick={goNext} disabled={!stepValid} className="gap-2">
            Próximo
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting || !stepValid}
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Concluir Cadastro
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
