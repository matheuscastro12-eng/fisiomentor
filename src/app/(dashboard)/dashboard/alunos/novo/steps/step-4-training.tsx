"use client";

import { useEffect, useState } from "react";
import { EXPERIENCE_LEVELS, TRAINING_GOALS, MODALITIES } from "@/types";

interface StepProps {
  data: any;
  onChange: (data: any) => void;
  onValidChange: (valid: boolean) => void;
}

export function Step4Training({ data, onChange, onValidChange }: StepProps) {
  const [experienceLevel, setExperienceLevel] = useState(
    data.experienceLevel ?? ""
  );
  const [preferredModalities, setPreferredModalities] = useState<string[]>(
    data.preferredModalities ?? []
  );
  const [weeklySessions, setWeeklySessions] = useState(
    data.weeklySessions ?? 3
  );
  const [minutesPerSession, setMinutesPerSession] = useState(
    data.minutesPerSession ?? 60
  );
  const [goals, setGoals] = useState<string[]>(data.goals ?? []);

  useEffect(() => {
    onChange({
      experienceLevel,
      preferredModalities,
      weeklySessions,
      minutesPerSession,
      goals,
    });
    onValidChange(experienceLevel !== "" && goals.length > 0);
  }, [experienceLevel, preferredModalities, weeklySessions, minutesPerSession, goals]);

  function toggleModality(value: string) {
    setPreferredModalities((prev) =>
      prev.includes(value)
        ? prev.filter((m) => m !== value)
        : [...prev, value]
    );
  }

  function toggleGoal(value: string) {
    setGoals((prev) =>
      prev.includes(value)
        ? prev.filter((g) => g !== value)
        : [...prev, value]
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-display text-title-lg text-on-surface">
        Perfil de Treino
      </h3>

      {/* Experience Level */}
      <div>
        <label className="block text-label-md font-body text-on-surface-variant mb-3">
          Nível de experiência
        </label>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setExperienceLevel(level.value)}
              className={`px-4 py-2 rounded-full font-body text-body-md transition-all ${
                experienceLevel === level.value
                  ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modalities */}
      <div>
        <label className="block text-label-md font-body text-on-surface-variant mb-3">
          Modalidades preferidas
        </label>
        <div className="flex flex-wrap gap-2">
          {MODALITIES.map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => toggleModality(mod)}
              className={`px-3 py-1.5 rounded-full text-label-sm font-body transition-all ${
                preferredModalities.includes(mod)
                  ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {preferredModalities.includes(mod) && "✓ "}
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Sessions Slider */}
      <div>
        <label className="block text-label-md font-body text-on-surface-variant mb-2">
          Frequência semanal:{" "}
          <span className="text-primary font-display text-title-md">
            {weeklySessions}x
          </span>
        </label>
        <input
          type="range"
          min={1}
          max={6}
          value={weeklySessions}
          onChange={(e) => setWeeklySessions(Number(e.target.value))}
          className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between mt-1">
          <span className="text-label-sm text-on-surface-variant">1x</span>
          <span className="text-label-sm text-on-surface-variant">6x</span>
        </div>
      </div>

      {/* Minutes per Session Slider */}
      <div>
        <label className="block text-label-md font-body text-on-surface-variant mb-2">
          Duração por sessão:{" "}
          <span className="text-primary font-display text-title-md">
            {minutesPerSession} min
          </span>
        </label>
        <input
          type="range"
          min={30}
          max={90}
          step={5}
          value={minutesPerSession}
          onChange={(e) => setMinutesPerSession(Number(e.target.value))}
          className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between mt-1">
          <span className="text-label-sm text-on-surface-variant">30 min</span>
          <span className="text-label-sm text-on-surface-variant">90 min</span>
        </div>
      </div>

      {/* Goals */}
      <div>
        <label className="block text-label-md font-body text-on-surface-variant mb-3">
          Objetivos *
        </label>
        <div className="flex flex-wrap gap-2">
          {TRAINING_GOALS.map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => toggleGoal(goal)}
              className={`px-3 py-1.5 rounded-full text-label-sm font-body transition-all ${
                goals.includes(goal)
                  ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {goals.includes(goal) && "✓ "}
              {goal}
            </button>
          ))}
        </div>
        {goals.length === 0 && (
          <p className="text-body-sm text-error/70 mt-2">
            Selecione pelo menos um objetivo
          </p>
        )}
      </div>
    </div>
  );
}
