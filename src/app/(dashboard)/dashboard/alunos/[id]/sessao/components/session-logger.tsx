"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  Save,
  Loader2,
  CheckCircle2,
  Dumbbell,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExerciseLog {
  exerciseName: string;
  completed: boolean;
  loadUsed: string;
  setsCompleted: number;
  repsCompleted: string;
  observation: string;
}

interface SessionLoggerProps {
  studentId: string;
  studentName: string;
  planId: string;
  planData: any;
  planSummary: string | null;
}

const BORG_SCALE = [
  { value: 6, label: "6", desc: "Nenhum esforço" },
  { value: 7, label: "7", desc: "Extremamente leve" },
  { value: 9, label: "9", desc: "Muito leve" },
  { value: 11, label: "11", desc: "Leve" },
  { value: 13, label: "13", desc: "Moderado" },
  { value: 15, label: "15", desc: "Intenso" },
  { value: 17, label: "17", desc: "Muito intenso" },
  { value: 19, label: "19", desc: "Máximo" },
];

export function SessionLogger({
  studentId,
  studentName,
  planId,
  planData,
  planSummary,
}: SessionLoggerProps) {
  const router = useRouter();
  const days = planData?.weekly_split ?? [];
  const [selectedDay, setSelectedDay] = useState(0);
  const [perceivedEffort, setPerceivedEffort] = useState<number | null>(null);
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Inicializar logs dos exercícios para cada dia
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[][]>(
    days.map((day: any) =>
      (day.exercises ?? []).map((ex: any) => ({
        exerciseName: ex.name,
        completed: true,
        loadUsed: "",
        setsCompleted: ex.sets,
        repsCompleted: ex.reps,
        observation: "",
      }))
    )
  );

  const currentExercises = exerciseLogs[selectedDay] ?? [];
  const currentDay = days[selectedDay];

  const updateExercise = (
    exIdx: number,
    field: keyof ExerciseLog,
    value: any
  ) => {
    setExerciseLogs((prev) => {
      const updated = [...prev];
      updated[selectedDay] = [...updated[selectedDay]];
      updated[selectedDay][exIdx] = {
        ...updated[selectedDay][exIdx],
        [field]: value,
      };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/training-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          exercisesDone: currentExercises,
          perceivedEffort: perceivedEffort ?? undefined,
          observations: observations || undefined,
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar");

      setSaved(true);
      setTimeout(() => {
        router.push(`/dashboard/alunos/${studentId}`);
        router.refresh();
      }, 1500);
    } catch {
      alert("Erro ao salvar sessão de treino.");
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center py-16 animate-fade-in">
        <CheckCircle2 className="h-16 w-16 text-success mb-4" />
        <h2 className="font-display text-headline-md text-on-surface mb-2">
          Sessão Registrada!
        </h2>
        <p className="text-body-md text-on-surface-variant">
          Redirecionando...
        </p>
      </div>
    );
  }

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
      <div className="mb-6">
        <h1 className="font-display text-headline-lg text-on-surface mb-1">
          Registrar Sessão de Treino
        </h1>
        <p className="text-body-md text-on-surface-variant">
          <span className="text-primary font-medium">{studentName}</span>
          {planSummary && ` — ${planSummary}`}
        </p>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {days.map((day: any, idx: number) => (
          <button
            key={idx}
            onClick={() => setSelectedDay(idx)}
            className={`px-4 py-2 rounded-xl text-body-sm font-medium whitespace-nowrap transition-all ${
              selectedDay === idx
                ? "bg-gradient-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {day.day?.replace(/^Dia \d+ — /, "") || `Dia ${idx + 1}`}
          </button>
        ))}
      </div>

      {/* Exercise Checklist */}
      <Card className="bg-surface-container-low mb-6">
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="h-5 w-5 text-primary" />
            <h2 className="font-display text-title-lg text-on-surface">
              {currentDay?.day ?? "Exercícios"}
            </h2>
            <Badge variant="teal">{currentDay?.session_type}</Badge>
          </div>

          <div className="space-y-3">
            {currentExercises.map((ex, exIdx) => {
              const planned = currentDay?.exercises?.[exIdx];
              return (
                <div
                  key={exIdx}
                  className={`p-4 rounded-xl transition-all ${
                    ex.completed
                      ? "bg-surface-container"
                      : "bg-surface-container opacity-60"
                  }`}
                >
                  {/* Exercise name + toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          updateExercise(exIdx, "completed", !ex.completed)
                        }
                        className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                          ex.completed
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {ex.completed ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                      <div>
                        <p className="font-body text-body-md text-on-surface font-medium">
                          {ex.exerciseName}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          Prescrito:{" "}
                          <span className="font-mono text-primary">
                            {planned?.sets}x{planned?.reps}
                          </span>{" "}
                          · {planned?.load_guidance}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Execution details */}
                  {ex.completed && (
                    <div className="grid grid-cols-3 gap-3 ml-10">
                      <div>
                        <label className="text-label-sm text-on-surface-variant block mb-1">
                          Séries
                        </label>
                        <input
                          type="number"
                          value={ex.setsCompleted}
                          onChange={(e) =>
                            updateExercise(
                              exIdx,
                              "setsCompleted",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-body-sm font-mono text-primary outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div>
                        <label className="text-label-sm text-on-surface-variant block mb-1">
                          Reps
                        </label>
                        <input
                          type="text"
                          value={ex.repsCompleted}
                          onChange={(e) =>
                            updateExercise(
                              exIdx,
                              "repsCompleted",
                              e.target.value
                            )
                          }
                          className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-body-sm font-mono text-primary outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div>
                        <label className="text-label-sm text-on-surface-variant block mb-1">
                          Carga
                        </label>
                        <input
                          type="text"
                          value={ex.loadUsed}
                          onChange={(e) =>
                            updateExercise(exIdx, "loadUsed", e.target.value)
                          }
                          placeholder="Ex: 40kg"
                          className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-body-sm font-mono text-primary outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/30"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* PSE (Perceived Effort) Selector */}
      <Card className="bg-surface-container-low mb-6">
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="h-5 w-5 text-primary" />
            <h2 className="font-display text-title-lg text-on-surface">
              Percepção Subjetiva de Esforço (Borg)
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {BORG_SCALE.map((item) => (
              <button
                key={item.value}
                onClick={() => setPerceivedEffort(item.value)}
                className={`p-3 rounded-xl text-center transition-all ${
                  perceivedEffort === item.value
                    ? item.value >= 17
                      ? "bg-error/20 border-2 border-error text-error"
                      : item.value >= 13
                      ? "bg-warning/20 border-2 border-warning text-warning"
                      : "bg-primary/20 border-2 border-primary text-primary"
                    : "bg-surface-container hover:bg-surface-container-high"
                }`}
              >
                <p className="font-mono text-title-lg">{item.label}</p>
                <p className="text-label-sm text-on-surface-variant">
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      <Card className="bg-surface-container-low mb-8">
        <CardContent className="pt-0">
          <label className="block text-title-sm text-on-surface mb-2">
            Observações da Sessão
          </label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Ex: Paciente relatou leve desconforto no joelho durante agachamento. Reduzimos amplitude. Bem disposto no restante..."
            className="w-full h-24 bg-surface-container rounded-xl px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none font-body"
          />
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <Link href={`/dashboard/alunos/${studentId}`}>
          <Button variant="ghost">Cancelar</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Sessão
        </Button>
      </div>
    </div>
  );
}
