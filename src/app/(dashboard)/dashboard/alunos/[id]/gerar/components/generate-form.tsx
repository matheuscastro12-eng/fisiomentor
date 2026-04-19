"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Shield,
  Pill,
  Target,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";

interface GenerateFormProps {
  studentId: string;
  studentName: string;
  diagnoses: string[];
  medications: { name: string; dosage?: string; condition?: string }[];
  cardiovascularRisk: string;
  goals: string[];
  weeklySessions: number;
  minutesPerSession: number;
  experienceLevel: string;
}

type GenerationStatus = "idle" | "generating" | "success" | "error";

export function GenerateForm({
  studentId,
  studentName,
  diagnoses,
  medications,
  cardiovascularRisk,
  goals,
  weeklySessions,
  minutesPerSession,
  experienceLevel,
}: GenerateFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);

  const hasRedFlags =
    cardiovascularRisk === "alto" ||
    diagnoses.some((d) =>
      /cardiopatia|insufici|avc/i.test(d)
    );

  // Check if student has enough data to generate
  const hasMinimalData = diagnoses.length > 0 || goals.length > 0;
  const insufficientDataMessage = !hasMinimalData
    ? "Cadastre pelo menos uma condição clínica ou objetivo para gerar um plano seguro."
    : null;

  const handleGenerate = async () => {
    setStatus("generating");
    setError("");

    // Abort controller with 120s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await apiFetch(
        `/api/students/${studentId}/generate`,
        {
          method: "POST",
          body: JSON.stringify({
            professionalNotes: notes || undefined,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const statusCode = response.status;

        if (statusCode === 401 || statusCode === 403) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }

        // Classify error type
        const errorMsg = data.error ?? data.details ?? "";
        if (errorMsg.includes("OpenAI") || errorMsg.includes("openai") || statusCode === 502) {
          throw new Error(
            "Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos."
          );
        }

        throw new Error(errorMsg || "Erro na geração do plano.");
      }

      const data = await response.json();

      // Validate plan structure
      if (!data.plan?.weekly_split || data.plan.weekly_split.length === 0) {
        // Plan JSON is invalid/empty — show raw and alert
        console.warn("Plano com estrutura inesperada:", data);
        setPlanId(data.id);
        setStatus("success");
      } else {
        setPlanId(data.id);
        setStatus("success");
      }

      // Redirect after 2s
      setTimeout(() => {
        router.push(`/dashboard/alunos/${studentId}`);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === "AbortError") {
        setError(
          "A geração excedeu o tempo limite (2 minutos). O servidor pode estar sobrecarregado. Tente novamente."
        );
      } else if (err.message.includes("Sessão expirada")) {
        setError(err.message);
        // Redirect to login after showing error
        setTimeout(() => {
          router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
        }, 3000);
      } else {
        setError(err.message);
      }
      setStatus("error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <Link
        href={`/dashboard/alunos/${studentId}`}
        className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao perfil
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-headline-lg text-on-surface mb-2">
          Gerar Treino com IA
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant">
          Plano personalizado para{" "}
          <span className="text-primary font-medium">{studentName}</span>
        </p>
      </div>

      {/* Patient Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Clinical */}
        <Card className="bg-surface-container-low">
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="text-title-sm text-on-surface">Perfil Clínico</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {diagnoses.length > 0 ? (
                diagnoses.map((d) => (
                  <Badge
                    key={d}
                    variant={
                      /cardio|insufici|avc|dpoc|h[eé]rnia/i.test(d)
                        ? "red"
                        : /hipertens|diabet|obesid/i.test(d)
                        ? "yellow"
                        : "neutral"
                    }
                  >
                    {d}
                  </Badge>
                ))
              ) : (
                <Badge variant="green">Sem restrições</Badge>
              )}
            </div>
            {cardiovascularRisk !== "baixo" && (
              <div className="mt-2">
                <Badge
                  variant={cardiovascularRisk === "alto" ? "red" : "yellow"}
                >
                  Risco CV: {cardiovascularRisk}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medications */}
        <Card className="bg-surface-container-low">
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 mb-3">
              <Pill className="h-4 w-4 text-warning" />
              <h3 className="text-title-sm text-on-surface">Medicamentos</h3>
            </div>
            {medications.length > 0 ? (
              <div className="space-y-1">
                {medications.slice(0, 3).map((m, i) => (
                  <p key={i} className="text-body-sm text-on-surface-variant">
                    {m.name}{" "}
                    {m.dosage && (
                      <span className="font-mono text-primary">
                        {m.dosage}
                      </span>
                    )}
                  </p>
                ))}
                {medications.length > 3 && (
                  <p className="text-body-sm text-on-surface-variant/50">
                    +{medications.length - 3} mais
                  </p>
                )}
              </div>
            ) : (
              <p className="text-body-sm text-on-surface-variant/50 italic">
                Nenhum
              </p>
            )}
          </CardContent>
        </Card>

        {/* Training Prefs */}
        <Card className="bg-surface-container-low">
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-title-sm text-on-surface">Treino</h3>
            </div>
            <div className="space-y-1 text-body-sm text-on-surface-variant">
              <p>
                <span className="font-mono text-primary">
                  {weeklySessions}x
                </span>
                /semana ·{" "}
                <span className="font-mono text-primary">
                  {minutesPerSession}
                </span>{" "}
                min
              </p>
              <p className="capitalize">{experienceLevel}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {goals.slice(0, 2).map((g) => (
                  <Badge key={g} variant="teal">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Red Flag Warning */}
      {hasRedFlags && (
        <Card className="bg-error-container/10 border border-error/20 mb-6">
          <CardContent className="pt-0 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" />
            <div>
              <p className="text-title-sm text-error mb-1">
                Paciente com Condição de Alto Risco
              </p>
              <p className="text-body-sm text-on-surface-variant">
                O plano será gerado com restrições clínicas especiais. A IA
                respeitará as contraindicações e incluirá protocolos de
                monitoramento obrigatórios. Revise cuidadosamente antes de
                aplicar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professional Notes */}
      <Card className="bg-surface-container-low mb-6">
        <CardContent className="pt-0">
          <label className="block text-title-sm text-on-surface mb-2">
            Observações do Profissional{" "}
            <span className="text-on-surface-variant font-normal">
              (opcional)
            </span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Foco em fortalecimento de membros inferiores, evitar exercícios acima da cabeça, paciente com dor lombar recente..."
            className="w-full h-28 bg-surface-container rounded-xl px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none font-body"
            disabled={status === "generating"}
          />
          <p className="text-label-sm text-on-surface-variant/50 mt-1">
            Estas notas serão consideradas pela IA na geração do plano.
          </p>
        </CardContent>
      </Card>

      {/* Generate Button / Status */}
      <div className="flex flex-col items-center gap-4">
        {status === "idle" && (
          <div className="flex flex-col items-center gap-3">
            {insufficientDataMessage && (
              <div className="flex items-center gap-2 px-4 py-2 bg-warning-container/10 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                <p className="text-body-sm text-warning">{insufficientDataMessage}</p>
              </div>
            )}
            <Button
              onClick={handleGenerate}
              size="lg"
              className="gap-2 px-8"
              disabled={!!insufficientDataMessage}
            >
              <Sparkles className="h-5 w-5" />
              Gerar Plano de Treino
            </Button>
          </div>
        )}

        {status === "generating" && (
          <Card className="bg-surface-container-low w-full">
            <CardContent className="flex flex-col items-center py-12">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-full bg-gradient-primary/10 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <Loader2 className="absolute -top-1 -right-1 h-6 w-6 text-primary animate-spin" />
              </div>
              <h3 className="font-display text-title-lg text-on-surface mb-2">
                Gerando plano de treino...
              </h3>
              <div className="space-y-2 text-center text-body-sm text-on-surface-variant">
                <p className="animate-fade-in">
                  🔍 Buscando diretrizes clínicas relevantes...
                </p>
                <p className="animate-fade-in" style={{ animationDelay: "2s" }}>
                  🧠 Analisando perfil e condições do paciente...
                </p>
                <p className="animate-fade-in" style={{ animationDelay: "4s" }}>
                  📋 Montando prescrição personalizada...
                </p>
                <p className="animate-fade-in" style={{ animationDelay: "6s" }}>
                  ✅ Validando contra regras clínicas...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {status === "success" && (
          <Card className="bg-success-container/10 border border-success/20 w-full">
            <CardContent className="flex flex-col items-center py-12">
              <CheckCircle2 className="h-16 w-16 text-success mb-4" />
              <h3 className="font-display text-title-lg text-on-surface mb-2">
                Plano Gerado com Sucesso!
              </h3>
              <p className="text-body-md text-on-surface-variant mb-4">
                Redirecionando para revisão...
              </p>
              <Link href={`/dashboard/alunos/${studentId}`}>
                <Button variant="secondary" className="gap-2">
                  Ver Plano Agora
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {status === "error" && (
          <Card className="bg-error-container/10 border border-error/20 w-full">
            <CardContent className="flex flex-col items-center py-8">
              <XCircle className="h-12 w-12 text-error mb-4" />
              <h3 className="font-display text-title-lg text-on-surface mb-2">
                Erro na Geração
              </h3>
              <p className="text-body-sm text-on-surface-variant mb-4 text-center max-w-md">
                {error}
              </p>
              <Button onClick={handleGenerate} variant="secondary" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
