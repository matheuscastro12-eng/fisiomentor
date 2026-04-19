"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StepProps {
  data: any;
  onChange: (data: any) => void;
  onValidChange: (valid: boolean) => void;
}

export function Step5Assessment({ data, onChange, onValidChange }: StepProps) {
  const [bodyFatPct, setBodyFatPct] = useState(data.bodyFatPct ?? "");
  const [leanMassKg, setLeanMassKg] = useState(data.leanMassKg ?? "");
  const [bmi, setBmi] = useState(data.bmi ?? "");
  const [fitnessTests, setFitnessTests] = useState<
    { name: string; result: string; unit: string }[]
  >(data.fitnessTests ?? []);

  useEffect(() => {
    onChange({
      bodyFatPct: bodyFatPct || undefined,
      leanMassKg: leanMassKg || undefined,
      bmi: bmi || undefined,
      fitnessTests,
    });
    onValidChange(true); // All optional
  }, [bodyFatPct, leanMassKg, bmi, fitnessTests]);

  // Auto-calculate BMI
  useEffect(() => {
    if (data.weightKg && data.heightCm) {
      const heightM = data.heightCm / 100;
      const calculatedBmi = (data.weightKg / (heightM * heightM)).toFixed(1);
      setBmi(calculatedBmi);
    }
  }, [data.weightKg, data.heightCm]);

  function addTest() {
    setFitnessTests((prev) => [...prev, { name: "", result: "", unit: "" }]);
  }

  function updateTest(index: number, field: string, value: string) {
    setFitnessTests((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  }

  function removeTest(index: number) {
    setFitnessTests((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-title-lg text-on-surface">
          Avaliação Física
        </h3>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Esta etapa é opcional. Pode ser preenchida posteriormente.
        </p>
      </div>

      {/* Body Composition */}
      <div>
        <label className="block text-label-md font-body text-on-surface-variant mb-3">
          Composição Corporal
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-label-sm text-on-surface-variant">
              % Gordura
            </label>
            <Input
              type="number"
              step="0.1"
              placeholder="18.5"
              value={bodyFatPct}
              onChange={(e) => setBodyFatPct(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-label-sm text-on-surface-variant">
              Massa Magra (kg)
            </label>
            <Input
              type="number"
              step="0.1"
              placeholder="55.0"
              value={leanMassKg}
              onChange={(e) => setLeanMassKg(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-label-sm text-on-surface-variant">
              IMC (calculado)
            </label>
            <Input
              type="number"
              step="0.1"
              placeholder="Auto"
              value={bmi}
              onChange={(e) => setBmi(e.target.value)}
              className="bg-surface-container"
            />
          </div>
        </div>
      </div>

      {/* Fitness Tests (dynamic list) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-label-md font-body text-on-surface-variant">
            Testes Físicos
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addTest}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Adicionar teste
          </Button>
        </div>
        {fitnessTests.map((test, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_0.8fr_0.6fr_auto] gap-3 mb-3 p-3 bg-surface-container rounded-xl"
          >
            <Input
              placeholder="Nome do teste"
              value={test.name}
              onChange={(e) => updateTest(idx, "name", e.target.value)}
            />
            <Input
              placeholder="Resultado"
              value={test.result}
              onChange={(e) => updateTest(idx, "result", e.target.value)}
            />
            <Input
              placeholder="Unidade"
              value={test.unit}
              onChange={(e) => updateTest(idx, "unit", e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeTest(idx)}
              className="h-11 w-11 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {fitnessTests.length === 0 && (
          <p className="text-body-sm text-on-surface-variant/50 italic">
            Nenhum teste físico registrado. Ex: VO2 máximo, teste de Cooper, flexibilidade.
          </p>
        )}
      </div>
    </div>
  );
}
