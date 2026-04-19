"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Plus, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { calculateAge } from "@/lib/utils";

interface StudentRow {
  id: string;
  name: string;
  birth_date: string | null;
  created_at: string;
  health_profiles: {
    diagnoses: string[] | null;
  } | null;
  training_preferences: {
    goals: string[] | null;
  } | null;
}

const conditionColors: Record<string, "red" | "yellow" | "neutral"> = {
  "Cardiopatia": "red",
  "Insuficiência Cardíaca": "red",
  "DPOC": "red",
  "AVC": "red",
  "Hérnia": "red",
  "Diabetes T1": "yellow",
  "Diabetes T2": "yellow",
  "Diabetes Tipo II": "yellow",
  "Hipertensão": "yellow",
  "Obesidade": "yellow",
};

function getConditionVariant(condition: string): "red" | "yellow" | "neutral" {
  return conditionColors[condition] ?? "neutral";
}

interface StudentListProps {
  students: StudentRow[];
}

export function StudentList({ students }: StudentListProps) {
  const [filter, setFilter] = useState<"active" | "archived">("active");

  if (students.length === 0) {
    return (
      <Card className="bg-surface-container-low">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-20 w-20 rounded-full bg-surface-container flex items-center justify-center mb-6">
            <UserPlus className="h-10 w-10 text-on-surface-variant" />
          </div>
          <h3 className="font-display text-headline-sm text-on-surface mb-2">
            Nenhum aluno cadastrado
          </h3>
          <p className="font-body text-body-md text-on-surface-variant mb-6 text-center max-w-md">
            Cadastre seu primeiro aluno para começar a gerar planos de treino
            personalizados com IA.
          </p>
          <Link href="/dashboard/alunos/novo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar primeiro aluno
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface-container-low">
      <CardContent className="pt-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-headline-sm text-on-surface">
            Gestão de Alunos
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1 rounded-full text-label-sm font-body transition-colors ${
                filter === "active"
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
              }`}
            >
              ATIVOS
            </button>
            <button
              onClick={() => setFilter("archived")}
              className={`px-3 py-1 rounded-full text-label-sm font-body transition-colors ${
                filter === "archived"
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
              }`}
            >
              ARQUIVADOS
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1.5fr_1.2fr_0.8fr] gap-4 pb-4">
          <span className="table-header">Aluno</span>
          <span className="table-header">Condição Clínica</span>
          <span className="table-header">Objetivo</span>
          <span className="table-header">Última Atualização</span>
          <span className="table-header text-right">Ações</span>
        </div>

        {/* Table Rows */}
        <div className="space-y-0">
          {students.map((student, idx) => {
            const diagnoses =
              (student.health_profiles?.diagnoses as string[]) ?? [];
            const goals =
              (student.training_preferences?.goals as string[]) ?? [];
            const age = student.birth_date
              ? calculateAge(student.birth_date)
              : null;
            const initials = student.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div
                key={student.id}
                className={`grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1.5fr_1.2fr_0.8fr] gap-4 items-center py-5 ${
                  idx % 2 === 0 ? "bg-surface" : "bg-surface-container-low"
                } rounded-lg px-4 -mx-4 transition-colors hover:bg-surface-container-high`}
              >
                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-display text-label-lg flex-shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="font-body text-title-sm text-on-surface">
                      {student.name}
                    </p>
                    <p className="font-mono text-label-sm text-on-surface-variant">
                      {age ? `${age} anos` : "Idade não informada"}
                    </p>
                  </div>
                </div>

                {/* Conditions */}
                <div className="flex flex-wrap gap-1.5">
                  {diagnoses.length > 0 ? (
                    <>
                      {diagnoses.slice(0, 3).map((cond) => (
                        <Badge
                          key={cond}
                          variant={getConditionVariant(cond)}
                        >
                          {cond}
                        </Badge>
                      ))}
                      {diagnoses.length > 3 && (
                        <Badge variant="neutral">
                          +{diagnoses.length - 3}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-body-sm text-on-surface-variant italic">
                      Nenhuma restrição
                    </span>
                  )}
                </div>

                {/* Objective */}
                <p className="font-body text-body-md text-on-surface">
                  {goals[0] || "Sem objetivo definido"}
                </p>

                {/* Last Update */}
                <p className="font-mono text-body-sm text-on-surface-variant">
                  {new Date(student.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/dashboard/alunos/${student.id}`}>
                    <button className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </Link>
                  <Button size="sm" variant="outline" className="text-label-sm">
                    Novo Plano
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4">
          <p className="font-body text-body-sm text-on-surface-variant">
            Exibindo {students.length} de {students.length} alunos registrados
          </p>
          <Link href="/dashboard/alunos/novo">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Aluno
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
