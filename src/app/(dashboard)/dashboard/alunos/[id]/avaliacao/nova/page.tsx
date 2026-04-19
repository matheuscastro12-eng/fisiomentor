"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Ruler,
  Activity,
  Scale,
  TrendingDown,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/* ─── Types ─── */
interface FitnessTest {
  name: string;
  result: string;
  unit: string;
}

interface AssessmentHistory {
  id: string;
  bodyFatPct: number | null;
  leanMassKg: number | null;
  bmi: number | null;
  fitnessTests: FitnessTest[];
  assessedAt: string;
  body_fat_pct?: number | null;
  lean_mass_kg?: number | null;
  assessed_at?: string;
  fitness_tests?: FitnessTest[];
}

interface StudentBasic {
  name: string;
  weightKg: number | null;
  heightCm: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
}

/* ─── Preset tests ─── */
const COMMON_TESTS = [
  { name: "VO2 máximo estimado", unit: "ml/kg/min" },
  { name: "Teste de caminhada 6min", unit: "metros" },
  { name: "Força de preensão manual", unit: "kgf" },
  { name: "Flexibilidade (sentar-alcançar)", unit: "cm" },
  { name: "Repetições abdominais 1min", unit: "reps" },
  { name: "Flexão de braço", unit: "reps" },
  { name: "Teste de Cooper", unit: "metros" },
  { name: "1RM supino", unit: "kg" },
  { name: "1RM leg press", unit: "kg" },
  { name: "Equilíbrio unipodal", unit: "segundos" },
];

export default function NovaAvaliacaoPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentBasic | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<AssessmentHistory[]>([]);

  // ─── Form state: Composição Corporal ───
  const [weightKg, setWeightKg] = useState("");
  const [bodyFatPct, setBodyFatPct] = useState("");
  const [leanMassKg, setLeanMassKg] = useState("");

  // ─── Form state: Testes Físicos ───
  const [fitnessTests, setFitnessTests] = useState<FitnessTest[]>([
    { name: "", result: "", unit: "" },
  ]);

  // ─── Computed: IMC ───
  const heightM =
    student != null
      ? ((student.heightCm ?? student.height_cm ?? 0) / 100)
      : 0;
  const currentWeight = weightKg ? parseFloat(weightKg) : null;
  const bmi =
    currentWeight && heightM > 0
      ? Math.round((currentWeight / (heightM * heightM)) * 10) / 10
      : null;

  // ─── Load student & history ───
  const loadData = useCallback(async () => {
    try {
      const [studentRes, historyRes] = await Promise.all([
        fetch(`/api/students/${studentId}`),
        fetch(`/api/students/${studentId}/assessments`),
      ]);

      if (studentRes.ok) {
        const data = await studentRes.json();
        setStudent(data);
        // Pre-fill weight from student if available
        const w = data.weightKg ?? data.weight_kg;
        if (w) setWeightKg(String(w));
      }

      if (historyRes.ok) {
        setHistory(await historyRes.json());
      }
    } catch {
      console.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Auto-calc lean mass when weight & body fat change ───
  useEffect(() => {
    const w = parseFloat(weightKg);
    const bf = parseFloat(bodyFatPct);
    if (!isNaN(w) && !isNaN(bf) && w > 0 && bf >= 0 && bf <= 100) {
      const lean = Math.round(w * (1 - bf / 100) * 10) / 10;
      setLeanMassKg(String(lean));
    }
  }, [weightKg, bodyFatPct]);

  // ─── Fitness test handlers ───
  function addTest(preset?: { name: string; unit: string }) {
    setFitnessTests((prev) => [
      ...prev,
      preset
        ? { name: preset.name, result: "", unit: preset.unit }
        : { name: "", result: "", unit: "" },
    ]);
  }

  function removeTest(idx: number) {
    setFitnessTests((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateTest(idx: number, field: keyof FitnessTest, value: string) {
    setFitnessTests((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t))
    );
  }

  // ─── Submit ───
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const validTests = fitnessTests.filter(
        (t) => t.name.trim() && t.result.trim() && t.unit.trim()
      );

      const payload: Record<string, unknown> = {
        fitnessTests: validTests,
      };

      const w = parseFloat(weightKg);
      if (!isNaN(w) && w > 0) payload.weightKg = w;

      const bf = parseFloat(bodyFatPct);
      if (!isNaN(bf)) payload.bodyFatPct = bf;

      const lm = parseFloat(leanMassKg);
      if (!isNaN(lm)) payload.leanMassKg = lm;

      if (bmi != null) payload.bmi = bmi;

      const res = await fetch(
        `/api/students/${studentId}/assessments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao salvar avaliação");
      }

      router.push(`/dashboard/alunos/${studentId}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message ?? "Erro ao salvar avaliação.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href={`/dashboard/alunos/${studentId}`}
        className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Perfil
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-headline-md text-on-surface">
          Nova Avaliação Física
        </h1>
        {student && (
          <p className="text-body-md text-on-surface-variant mt-1">
            {student.name}
            {student.heightCm || student.height_cm
              ? ` · ${student.heightCm ?? student.height_cm} cm`
              : ""}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── Bloco 1: Composição Corporal ─── */}
        <Card className="bg-surface-container-low">
          <CardContent className="pt-0">
            <h2 className="font-display text-title-md text-on-surface flex items-center gap-2 mb-6">
              <Scale className="h-5 w-5 text-primary" />
              Composição Corporal
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Peso */}
              <div>
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Peso (kg)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  placeholder="75.0"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>

              {/* % Gordura */}
              <div>
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  % Gordura
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="2"
                  max="70"
                  placeholder="18.5"
                  value={bodyFatPct}
                  onChange={(e) => setBodyFatPct(e.target.value)}
                />
              </div>

              {/* Massa Magra */}
              <div>
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Massa Magra (kg)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="10"
                  max="200"
                  placeholder="auto"
                  value={leanMassKg}
                  onChange={(e) => setLeanMassKg(e.target.value)}
                />
                <p className="text-[10px] text-on-surface-variant/50 mt-1">
                  Calculado automaticamente
                </p>
              </div>

              {/* IMC (read-only) */}
              <div>
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  IMC
                </label>
                <div className="h-10 rounded-xl bg-surface-container flex items-center px-4">
                  <span className="font-mono text-body-md text-primary">
                    {bmi ?? "—"}
                  </span>
                  {bmi && (
                    <span className="text-label-sm text-on-surface-variant ml-2">
                      {bmi < 18.5
                        ? "Abaixo"
                        : bmi < 25
                        ? "Normal"
                        : bmi < 30
                        ? "Sobrepeso"
                        : "Obesidade"}
                    </span>
                  )}
                </div>
                {heightM > 0 && (
                  <p className="text-[10px] text-on-surface-variant/50 mt-1">
                    Altura: {Math.round(heightM * 100)} cm
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Bloco 2: Testes Físicos ─── */}
        <Card className="bg-surface-container-low">
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-title-md text-on-surface flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Testes Físicos
              </h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1"
                onClick={() => addTest()}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Teste
              </Button>
            </div>

            {/* Quick add presets */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {COMMON_TESTS.filter(
                (ct) => !fitnessTests.some((ft) => ft.name === ct.name)
              )
                .slice(0, 6)
                .map((ct) => (
                  <button
                    key={ct.name}
                    type="button"
                    onClick={() => addTest(ct)}
                    className="text-label-sm px-3 py-1 rounded-full bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    + {ct.name}
                  </button>
                ))}
            </div>

            {/* Test rows */}
            <div className="space-y-3">
              {fitnessTests.map((test, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_120px_100px_40px] gap-3 items-end"
                >
                  <div>
                    {idx === 0 && (
                      <label className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                        Nome do Teste
                      </label>
                    )}
                    <Input
                      placeholder="Ex: VO2 máximo estimado"
                      value={test.name}
                      onChange={(e) => updateTest(idx, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    {idx === 0 && (
                      <label className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                        Resultado
                      </label>
                    )}
                    <Input
                      placeholder="32.5"
                      value={test.result}
                      onChange={(e) => updateTest(idx, "result", e.target.value)}
                    />
                  </div>
                  <div>
                    {idx === 0 && (
                      <label className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                        Unidade
                      </label>
                    )}
                    <Input
                      placeholder="ml/kg/min"
                      value={test.unit}
                      onChange={(e) => updateTest(idx, "unit", e.target.value)}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => removeTest(idx)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {fitnessTests.length === 0 && (
                <p className="text-body-sm text-on-surface-variant/50 text-center italic py-6">
                  Nenhum teste adicionado. Use os atalhos acima ou clique em
                  &quot;Adicionar Teste&quot;.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── Actions ─── */}
        <div className="flex items-center justify-end gap-3">
          <Link href={`/dashboard/alunos/${studentId}`}>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-2 min-w-[160px]">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Avaliação
              </>
            )}
          </Button>
        </div>
      </form>

      {/* ─── Histórico de Avaliações Anteriores ─── */}
      {history.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-title-md text-on-surface flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-on-surface-variant" />
            Avaliações Anteriores
          </h2>

          <div className="space-y-3">
            {history.map((a) => {
              const date = a.assessedAt ?? a.assessed_at;
              const fat = a.bodyFatPct ?? a.body_fat_pct;
              const lean = a.leanMassKg ?? a.lean_mass_kg;
              const tests = a.fitnessTests ?? a.fitness_tests ?? [];

              return (
                <Card key={a.id} className="bg-surface-container-low">
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-display text-title-sm text-on-surface">
                        {date
                          ? new Date(date).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : "Data desconhecida"}
                      </span>
                    </div>

                    {/* Body composition metrics */}
                    <div className="flex flex-wrap gap-4 mb-3">
                      {fat != null && (
                        <div className="flex items-center gap-1.5">
                          <TrendingDown className="h-3.5 w-3.5 text-primary" />
                          <span className="text-label-sm text-on-surface-variant">
                            %G
                          </span>
                          <span className="font-mono text-body-md text-primary">
                            {fat}%
                          </span>
                        </div>
                      )}
                      {lean != null && (
                        <div className="flex items-center gap-1.5">
                          <Ruler className="h-3.5 w-3.5 text-primary" />
                          <span className="text-label-sm text-on-surface-variant">
                            MM
                          </span>
                          <span className="font-mono text-body-md text-primary">
                            {lean} kg
                          </span>
                        </div>
                      )}
                      {a.bmi != null && (
                        <div className="flex items-center gap-1.5">
                          <Scale className="h-3.5 w-3.5 text-on-surface-variant" />
                          <span className="text-label-sm text-on-surface-variant">
                            IMC
                          </span>
                          <span className="font-mono text-body-md text-on-surface">
                            {a.bmi}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Fitness tests */}
                    {tests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tests.map((t: FitnessTest, i: number) => (
                          <Badge key={i} variant="neutral">
                            {t.name}: {t.result} {t.unit}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
