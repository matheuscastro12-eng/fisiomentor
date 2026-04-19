"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Pill, Shield, Target } from "lucide-react";

interface HealthDataTabProps {
  healthProfile: any;
  trainingPrefs: any;
}

export function HealthDataTab({
  healthProfile,
  trainingPrefs,
}: HealthDataTabProps) {
  const diagnoses = (healthProfile?.diagnoses as string[]) ?? [];
  const medications = (healthProfile?.medications as any[]) ?? [];
  const surgeries = (healthProfile?.surgeries as any[]) ?? [];
  const injuries = (healthProfile?.injuries as string[]) ?? [];
  const goals = (trainingPrefs?.goals as string[]) ?? [];
  const modalities = (trainingPrefs?.preferred_modalities as string[]) ?? [];

  return (
    <div className="space-y-4">
      {/* Clinical Profile */}
      <Card className="bg-surface-container-low">
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display text-title-md text-on-surface flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Perfil Clínico
            </h4>
            <Button variant="ghost" size="sm" className="gap-1">
              <Pencil className="h-3 w-3" />
              Editar
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                Diagnósticos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {diagnoses.length > 0 ? (
                  diagnoses.map((d) => (
                    <Badge key={d} variant="neutral">
                      {d}
                    </Badge>
                  ))
                ) : (
                  <span className="text-body-sm text-on-surface-variant/50 italic">
                    Nenhum diagnóstico
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                Risco Cardiovascular
              </p>
              <Badge
                variant={
                  healthProfile?.cardiovascular_risk === "alto"
                    ? "red"
                    : healthProfile?.cardiovascular_risk === "moderado"
                    ? "yellow"
                    : "green"
                }
              >
                {healthProfile?.cardiovascular_risk ?? "Não avaliado"}
              </Badge>
            </div>

            {injuries.length > 0 && (
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                  Lesões
                </p>
                <p className="text-body-sm text-on-surface">
                  {injuries.join(", ")}
                </p>
              </div>
            )}

            {surgeries.length > 0 && (
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                  Cirurgias
                </p>
                {surgeries.map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-surface-container rounded-lg p-2 mb-1"
                  >
                    <span className="text-body-sm text-on-surface">
                      {s.type}
                    </span>
                    <span className="text-label-sm text-on-surface-variant">
                      {s.date}
                    </span>
                    <Badge variant="neutral">{s.rehabilitationStatus}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medications */}
      {medications.length > 0 && (
        <Card className="bg-surface-container-low">
          <CardContent className="pt-0">
            <h4 className="font-display text-title-md text-on-surface flex items-center gap-2 mb-4">
              <Pill className="h-4 w-4 text-warning" />
              Medicamentos em Uso
            </h4>
            <div className="space-y-2">
              {medications.map((med: any, idx: number) => (
                <div
                  key={idx}
                  className="grid grid-cols-4 gap-3 p-3 bg-surface-container rounded-xl"
                >
                  <div>
                    <p className="text-label-sm text-on-surface-variant">
                      Nome
                    </p>
                    <p className="text-body-sm text-on-surface font-medium">
                      {med.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-label-sm text-on-surface-variant">
                      Dosagem
                    </p>
                    <p className="font-mono text-body-sm text-primary">
                      {med.dosage}
                    </p>
                  </div>
                  <div>
                    <p className="text-label-sm text-on-surface-variant">
                      Condição
                    </p>
                    <p className="text-body-sm text-on-surface">
                      {med.condition}
                    </p>
                  </div>
                  <div>
                    <p className="text-label-sm text-on-surface-variant">
                      Horário
                    </p>
                    <p className="text-body-sm text-on-surface">
                      {med.schedule}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Preferences */}
      <Card className="bg-surface-container-low">
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display text-title-md text-on-surface flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Preferências de Treino
            </h4>
            <Button variant="ghost" size="sm" className="gap-1">
              <Pencil className="h-3 w-3" />
              Editar
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-label-sm text-on-surface-variant mb-1">
                Nível de Experiência
              </p>
              <p className="text-body-md text-on-surface capitalize">
                {trainingPrefs?.experience_level ?? "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant mb-1">
                Frequência
              </p>
              <p className="font-mono text-body-md text-primary">
                {trainingPrefs?.weekly_sessions ?? "—"}x/semana
              </p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant mb-1">
                Duração por Sessão
              </p>
              <p className="font-mono text-body-md text-primary">
                {trainingPrefs?.minutes_per_session ?? "—"} min
              </p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant mb-1">
                Modalidades
              </p>
              <div className="flex flex-wrap gap-1">
                {modalities.length > 0 ? (
                  modalities.map((m) => (
                    <Badge key={m} variant="neutral">
                      {m}
                    </Badge>
                  ))
                ) : (
                  <span className="text-body-sm text-on-surface-variant/50">
                    —
                  </span>
                )}
              </div>
            </div>
          </div>

          {goals.length > 0 && (
            <div className="mt-4">
              <p className="text-label-sm text-on-surface-variant mb-2">
                Objetivos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {goals.map((g) => (
                  <Badge key={g} variant="teal">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
