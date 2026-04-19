"use client";

import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CLINICAL_CONDITIONS } from "@/types";

interface StepProps {
  data: any;
  onChange: (data: any) => void;
  onValidChange: (valid: boolean) => void;
}

export function Step2Clinical({ data, onChange, onValidChange }: StepProps) {
  const [diagnoses, setDiagnoses] = useState<string[]>(data.diagnoses ?? []);
  const [injuries, setInjuries] = useState(data.injuries ?? "");
  const [surgeries, setSurgeries] = useState<
    { type: string; date: string; rehabilitationStatus: string }[]
  >(data.surgeries ?? []);

  useEffect(() => {
    onChange({ diagnoses, injuries, surgeries });
    onValidChange(true); // Step 2 is always valid (all optional)
  }, [diagnoses, injuries, surgeries]);

  function toggleDiagnosis(value: string) {
    setDiagnoses((prev) =>
      prev.includes(value)
        ? prev.filter((d) => d !== value)
        : [...prev, value]
    );
  }

  function addSurgery() {
    setSurgeries((prev) => [
      ...prev,
      { type: "", date: "", rehabilitationStatus: "em andamento" },
    ]);
  }

  function updateSurgery(index: number, field: string, value: string) {
    setSurgeries((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function removeSurgery(index: number) {
    setSurgeries((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <h3 className="font-display text-title-lg text-on-surface">
        Histórico Clínico
      </h3>

      {/* Diagnoses as chips */}
      <div>
        <label className="block text-label-md font-body text-on-surface-variant mb-3">
          Diagnósticos
        </label>
        <div className="flex flex-wrap gap-2">
          {CLINICAL_CONDITIONS.map((cond) => {
            const selected = diagnoses.includes(cond.value);
            return (
              <button
                key={cond.value}
                type="button"
                onClick={() => toggleDiagnosis(cond.value)}
                className={`px-3 py-1.5 rounded-full text-label-sm font-body transition-all duration-200 ${
                  selected
                    ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                {selected && "✓ "}
                {cond.label}
              </button>
            );
          })}
        </div>
        {diagnoses.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {diagnoses.map((d) => (
              <Badge key={d} variant="teal" className="gap-1">
                {d}
                <button
                  type="button"
                  onClick={() => toggleDiagnosis(d)}
                  className="ml-1 hover:text-error"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Injuries */}
      <div>
        <label className="block text-label-md font-body text-on-surface-variant mb-1.5">
          Lesões (texto livre)
        </label>
        <textarea
          value={injuries}
          onChange={(e) => setInjuries(e.target.value)}
          placeholder="Descreva lesões relevantes..."
          rows={3}
          className="w-full rounded-xl bg-surface-container-highest px-4 py-3 font-body text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      {/* Surgeries (dynamic list) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-label-md font-body text-on-surface-variant">
            Cirurgias
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addSurgery}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Adicionar
          </Button>
        </div>
        {surgeries.map((surgery, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 mb-3 p-3 bg-surface-container rounded-xl"
          >
            <Input
              placeholder="Tipo da cirurgia"
              value={surgery.type}
              onChange={(e) => updateSurgery(idx, "type", e.target.value)}
            />
            <Input
              type="date"
              value={surgery.date}
              onChange={(e) => updateSurgery(idx, "date", e.target.value)}
            />
            <select
              value={surgery.rehabilitationStatus}
              onChange={(e) =>
                updateSurgery(idx, "rehabilitationStatus", e.target.value)
              }
              className="h-11 rounded-xl bg-surface-container-highest px-3 font-body text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="em andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
              <option value="parcial">Parcial</option>
            </select>
            <button
              type="button"
              onClick={() => removeSurgery(idx)}
              className="h-11 w-11 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {surgeries.length === 0 && (
          <p className="text-body-sm text-on-surface-variant/50 italic">
            Nenhuma cirurgia registrada
          </p>
        )}
      </div>
    </div>
  );
}
