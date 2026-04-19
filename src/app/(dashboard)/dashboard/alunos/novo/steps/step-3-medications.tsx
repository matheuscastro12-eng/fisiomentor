"use client";

import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PARQ_QUESTIONS } from "@/lib/validations/student";

interface StepProps {
  data: any;
  onChange: (data: any) => void;
  onValidChange: (valid: boolean) => void;
}

export function Step3Medications({ data, onChange, onValidChange }: StepProps) {
  const [medications, setMedications] = useState<
    { name: string; dosage: string; condition: string; schedule: string }[]
  >(data.medications ?? []);
  const [parqResult, setParqResult] = useState<Record<string, boolean>>(
    data.parqResult ?? {}
  );
  const [cardiovascularRisk, setCardiovascularRisk] = useState(
    data.cardiovascularRisk ?? "baixo"
  );

  useEffect(() => {
    onChange({ medications, parqResult, cardiovascularRisk });
    onValidChange(true);
  }, [medications, parqResult, cardiovascularRisk]);

  function addMedication() {
    setMedications((prev) => [
      ...prev,
      { name: "", dosage: "", condition: "", schedule: "" },
    ]);
  }

  function updateMedication(index: number, field: string, value: string) {
    setMedications((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  function removeMedication(index: number) {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleParq(key: string) {
    setParqResult((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const parqYesCount = Object.values(parqResult).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <h3 className="font-display text-title-lg text-on-surface">
        Medicamentos e Risco
      </h3>

      {/* Medications (dynamic list) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-label-md font-body text-on-surface-variant">
            Medicamentos em uso
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addMedication}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Adicionar
          </Button>
        </div>
        {medications.map((med, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_0.7fr_1fr_0.7fr_auto] gap-3 mb-3 p-3 bg-surface-container rounded-xl"
          >
            <Input
              placeholder="Nome"
              value={med.name}
              onChange={(e) => updateMedication(idx, "name", e.target.value)}
            />
            <Input
              placeholder="Dosagem"
              value={med.dosage}
              onChange={(e) => updateMedication(idx, "dosage", e.target.value)}
            />
            <Input
              placeholder="Condição tratada"
              value={med.condition}
              onChange={(e) =>
                updateMedication(idx, "condition", e.target.value)
              }
            />
            <Input
              placeholder="Horário"
              value={med.schedule}
              onChange={(e) =>
                updateMedication(idx, "schedule", e.target.value)
              }
            />
            <button
              type="button"
              onClick={() => removeMedication(idx)}
              className="h-11 w-11 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {medications.length === 0 && (
          <p className="text-body-sm text-on-surface-variant/50 italic">
            Nenhum medicamento registrado
          </p>
        )}
      </div>

      {/* PAR-Q */}
      <div>
        <label className="block text-label-md font-body text-on-surface-variant mb-3">
          PAR-Q — Questionário de Prontidão para Atividade Física
        </label>
        <div className="space-y-3">
          {PARQ_QUESTIONS.map((question, idx) => {
            const key = `q${idx + 1}`;
            const checked = parqResult[key] ?? false;
            return (
              <div
                key={key}
                className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                  checked
                    ? "bg-warning-container/10"
                    : "bg-surface-container"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleParq(key)}
                  className={`mt-0.5 h-5 w-5 rounded flex-shrink-0 flex items-center justify-center transition-colors ${
                    checked
                      ? "bg-warning text-warning-on"
                      : "bg-surface-container-highest"
                  }`}
                >
                  {checked && (
                    <span className="text-xs font-bold">S</span>
                  )}
                </button>
                <p className="font-body text-body-sm text-on-surface leading-relaxed">
                  {question}
                </p>
              </div>
            );
          })}
        </div>
        {parqYesCount > 0 && (
          <div className="mt-3 p-3 bg-warning-container/10 rounded-xl">
            <p className="text-body-sm text-warning font-body font-medium">
              {parqYesCount} resposta(s) positiva(s) — encaminhar para
              avaliação médica antes de iniciar atividades.
            </p>
          </div>
        )}
      </div>

      {/* Cardiovascular Risk */}
      <div>
        <label className="block text-label-md font-body text-on-surface-variant mb-3">
          Estratificação de Risco Cardiovascular
        </label>
        <div className="flex gap-3">
          {(["baixo", "moderado", "alto"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setCardiovascularRisk(level)}
              className={`flex-1 py-3 px-4 rounded-xl font-body text-title-sm text-center capitalize transition-all ${
                cardiovascularRisk === level
                  ? level === "alto"
                    ? "bg-error-container/30 text-error ring-1 ring-error/30"
                    : level === "moderado"
                    ? "bg-warning-container/30 text-warning ring-1 ring-warning/30"
                    : "bg-success-container/30 text-success ring-1 ring-success/30"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
