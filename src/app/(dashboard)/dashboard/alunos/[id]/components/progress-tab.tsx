"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Activity,
  BarChart3,
  Calendar,
  Gauge,
  Loader2,
  Ruler,
  Scale,
  Percent,
  Dumbbell,
  FlaskConical,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";

/* ─── Types ─── */
interface ProgressTabProps {
  studentId: string;
}

interface ProgressRecord {
  id: string;
  metricType: string;
  value: number;
  unit: string | null;
  recordedAt: string;
  recorded_at?: string;
  metric_type?: string;
}

interface ProgressSummary {
  totalSessions: number;
  averagePSE: number | null;
  weeklyFrequency: number;
  lastSession: string | null;
  assessments: any[];
}

interface TrainingSessionData {
  id: string;
  sessionDate: string;
  session_date?: string;
  perceivedEffort: number | null;
  perceived_effort?: number | null;
  exercisesDone: any[];
  exercises_done?: any[];
  observations: string | null;
}

type PeriodFilter = "3m" | "6m" | "1y" | "all";

/* ─── Helpers ─── */
const PERIOD_LABELS: Record<PeriodFilter, string> = {
  "3m": "3 meses",
  "6m": "6 meses",
  "1y": "1 ano",
  all: "Tudo",
};

function getPeriodCutoff(period: PeriodFilter): Date | null {
  if (period === "all") return null;
  const now = new Date();
  switch (period) {
    case "3m":
      now.setMonth(now.getMonth() - 3);
      return now;
    case "6m":
      now.setMonth(now.getMonth() - 6);
      return now;
    case "1y":
      now.setFullYear(now.getFullYear() - 1);
      return now;
  }
}

function formatDatePtBR(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function formatDateFullPtBR(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ─── Chart colors ─── */
const TEAL = "#42dec3";
const CORAL = "#ff6b6b";

function getTrendColor(data: { value: number }[], metricType: string): string {
  if (data.length < 2) return TEAL;
  const first = data[0].value;
  const last = data[data.length - 1].value;

  // Para % gordura e IMC, diminuir é positivo
  const lowerIsBetter = ["body_fat_pct", "bmi"].includes(metricType);
  if (lowerIsBetter) {
    return last <= first ? TEAL : CORAL;
  }
  // Para o resto (massa magra, peso, testes), aumentar é geralmente positivo
  return last >= first ? TEAL : CORAL;
}

/* ─── Custom Tooltip ─── */
function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-high/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-ambient-sm">
      <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>
      <p className="font-mono text-body-md text-primary">
        {payload[0].value}
        {unit ? ` ${unit}` : ""}
      </p>
    </div>
  );
}

/* ─── Individual Chart Card ─── */
function EvolutionChart({
  title,
  icon,
  data,
  unit,
  metricType,
  studentId,
}: {
  title: string;
  icon: React.ReactNode;
  data: { date: string; value: number }[];
  unit: string;
  metricType: string;
  studentId: string;
}) {
  if (data.length < 2) {
    return (
      <Card className="bg-surface-container-low">
        <CardContent className="pt-0">
          <h4 className="font-display text-title-sm text-on-surface flex items-center gap-2 mb-4">
            {icon}
            {title}
          </h4>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3 className="h-10 w-10 text-on-surface-variant/20 mb-3" />
            <p className="text-body-sm text-on-surface-variant/50 mb-4">
              {data.length === 0
                ? "Nenhum registro encontrado"
                : "Apenas 1 registro. Faça outra avaliação para ver a evolução."}
            </p>
            <Link href={`/dashboard/alunos/${studentId}/avaliacao/nova`}>
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Ruler className="h-3.5 w-3.5" />
                Registrar Avaliação
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const baseline = data[0].value;
  const current = data[data.length - 1].value;
  const diff = current - baseline;
  const diffPercent =
    baseline !== 0 ? Math.round((diff / baseline) * 1000) / 10 : 0;
  const color = getTrendColor(data, metricType);

  return (
    <Card className="bg-surface-container-low">
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-display text-title-sm text-on-surface flex items-center gap-2">
            {icon}
            {title}
          </h4>
          <div className="flex items-center gap-2">
            <span className="font-mono text-headline-sm" style={{ color }}>
              {current}
            </span>
            <span className="text-label-sm text-on-surface-variant">{unit}</span>
          </div>
        </div>

        {/* Delta indicator */}
        <div className="flex items-center gap-1.5 mb-4">
          <span
            className="text-label-sm font-mono px-2 py-0.5 rounded-md"
            style={{
              color,
              backgroundColor: color === TEAL ? "rgba(66,222,195,0.1)" : "rgba(255,107,107,0.1)",
            }}
          >
            {diff > 0 ? "+" : ""}
            {Math.round(diff * 10) / 10} {unit} ({diffPercent > 0 ? "+" : ""}
            {diffPercent}%)
          </span>
          <span className="text-label-sm text-on-surface-variant/50">
            vs baseline
          </span>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
              tickLine={false}
              axisLine={false}
              width={45}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <ReferenceLine
              y={baseline}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="6 4"
              label={{
                value: `Baseline: ${baseline}`,
                position: "insideTopRight",
                fill: "rgba(255,255,255,0.3)",
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={{
                r: 4,
                fill: color,
                stroke: "rgba(6,20,35,0.8)",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: color,
                stroke: "rgba(6,20,35,0.8)",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ─── Main Component ─── */
export function ProgressTab({ studentId }: ProgressTabProps) {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [sessions, setSessions] = useState<TrainingSessionData[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [customMetric, setCustomMetric] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const [summaryRes, sessionsRes, progressRes] = await Promise.all([
          apiFetch(`/api/students/${studentId}/progress/summary`),
          apiFetch(`/api/students/${studentId}/sessions?limit=10`),
          apiFetch(`/api/students/${studentId}/progress`),
        ]);

        if (summaryRes.ok) setSummary(await summaryRes.json());
        if (sessionsRes.ok) setSessions(await sessionsRes.json());
        if (progressRes.ok) {
          const records = await progressRes.json();
          setProgressRecords(records);
        }
      } catch {
        console.error("Erro ao carregar dados de progresso");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  /* ─── Process records into chart data ─── */
  const filteredRecords = useMemo(() => {
    const cutoff = getPeriodCutoff(period);
    if (!cutoff) return progressRecords;
    return progressRecords.filter((r) => {
      const date = new Date(r.recordedAt ?? r.recorded_at ?? "");
      return date >= cutoff;
    });
  }, [progressRecords, period]);

  function getChartData(metricType: string) {
    return filteredRecords
      .filter((r) => (r.metricType ?? r.metric_type) === metricType)
      .sort(
        (a, b) =>
          new Date(a.recordedAt ?? a.recorded_at ?? "").getTime() -
          new Date(b.recordedAt ?? b.recorded_at ?? "").getTime()
      )
      .map((r) => ({
        date: formatDatePtBR(r.recordedAt ?? r.recorded_at ?? ""),
        value: Math.round(r.value * 10) / 10,
      }));
  }

  const weightData = getChartData("weight_kg");
  const fatData = getChartData("body_fat_pct");
  const leanData = getChartData("lean_mass_kg");

  /* ─── Available custom metrics (fitness tests) ─── */
  const availableCustomMetrics = useMemo(() => {
    const coreMetrics = new Set(["weight_kg", "body_fat_pct", "lean_mass_kg", "bmi"]);
    const metrics = new Map<string, string>();
    for (const r of progressRecords) {
      const mt = r.metricType ?? r.metric_type ?? "";
      if (!coreMetrics.has(mt) && !metrics.has(mt)) {
        metrics.set(mt, r.unit ?? "");
      }
    }
    return Array.from(metrics.entries()).map(([key, unit]) => ({
      key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      unit,
    }));
  }, [progressRecords]);

  const customData = customMetric ? getChartData(customMetric) : [];
  const customUnit =
    availableCustomMetrics.find((m) => m.key === customMetric)?.unit ?? "";

  // Auto-select first custom metric
  useEffect(() => {
    if (!customMetric && availableCustomMetrics.length > 0) {
      setCustomMetric(availableCustomMetrics[0].key);
    }
  }, [availableCustomMetrics, customMetric]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const hasAnyChartData =
    weightData.length > 0 ||
    fatData.length > 0 ||
    leanData.length > 0 ||
    customData.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top bar: CTA + Period Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href={`/dashboard/alunos/${studentId}/avaliacao/nova`}>
          <Button variant="secondary" size="sm" className="gap-2">
            <Ruler className="h-4 w-4" />
            Registrar Avaliação
          </Button>
        </Link>

        {hasAnyChartData && (
          <div className="flex items-center gap-1.5 bg-surface-container rounded-xl p-1">
            {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-label-sm font-body transition-colors ${
                  period === p
                    ? "bg-primary/15 text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricMini
          icon={<Calendar className="h-4 w-4" />}
          label="Sessões Realizadas"
          value={String(summary?.totalSessions ?? 0)}
        />
        <MetricMini
          icon={<Gauge className="h-4 w-4" />}
          label="PSE Média"
          value={summary?.averagePSE ? String(summary.averagePSE) : "—"}
          subtitle={getPSELabel(summary?.averagePSE)}
        />
        <MetricMini
          icon={<Activity className="h-4 w-4" />}
          label="Frequência Semanal"
          value={`${summary?.weeklyFrequency ?? 0}x`}
          subtitle="últimas 4 semanas"
        />
        <MetricMini
          icon={<BarChart3 className="h-4 w-4" />}
          label="Última Sessão"
          value={
            summary?.lastSession
              ? new Date(summary.lastSession).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })
              : "—"
          }
        />
      </div>

      {/* ─── Evolution Charts Grid 2×2 ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EvolutionChart
          title="Peso"
          icon={<Scale className="h-4 w-4 text-primary" />}
          data={weightData}
          unit="kg"
          metricType="weight_kg"
          studentId={studentId}
        />
        <EvolutionChart
          title="% Gordura Corporal"
          icon={<Percent className="h-4 w-4 text-primary" />}
          data={fatData}
          unit="%"
          metricType="body_fat_pct"
          studentId={studentId}
        />
        <EvolutionChart
          title="Massa Magra"
          icon={<Dumbbell className="h-4 w-4 text-primary" />}
          data={leanData}
          unit="kg"
          metricType="lean_mass_kg"
          studentId={studentId}
        />

        {/* Custom Metric Chart */}
        <Card className="bg-surface-container-low">
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display text-title-sm text-on-surface flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                Métrica Personalizada
              </h4>
              {availableCustomMetrics.length > 0 && (
                <Select value={customMetric} onValueChange={setCustomMetric}>
                  <SelectTrigger className="w-[200px] h-8 text-label-sm">
                    <SelectValue placeholder="Selecionar teste" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCustomMetrics.map((m) => (
                      <SelectItem key={m.key} value={m.key}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {availableCustomMetrics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FlaskConical className="h-10 w-10 text-on-surface-variant/20 mb-3" />
                <p className="text-body-sm text-on-surface-variant/50 mb-4">
                  Nenhum teste físico registrado ainda
                </p>
                <Link href={`/dashboard/alunos/${studentId}/avaliacao/nova`}>
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    <Ruler className="h-3.5 w-3.5" />
                    Registrar Avaliação
                  </Button>
                </Link>
              </div>
            ) : customData.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="h-10 w-10 text-on-surface-variant/20 mb-3" />
                <p className="text-body-sm text-on-surface-variant/50 mb-4">
                  {customData.length === 0
                    ? "Nenhum registro para esta métrica"
                    : "Apenas 1 registro. Faça outra avaliação para ver a evolução."}
                </p>
                <Link href={`/dashboard/alunos/${studentId}/avaliacao/nova`}>
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    <Ruler className="h-3.5 w-3.5" />
                    Registrar Avaliação
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Delta */}
                {(() => {
                  const baseline = customData[0].value;
                  const current = customData[customData.length - 1].value;
                  const diff = current - baseline;
                  const color = getTrendColor(customData, customMetric);
                  return (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-mono text-headline-sm" style={{ color }}>
                        {current}
                      </span>
                      <span className="text-label-sm text-on-surface-variant">
                        {customUnit}
                      </span>
                      <span
                        className="text-label-sm font-mono px-2 py-0.5 rounded-md"
                        style={{
                          color,
                          backgroundColor:
                            color === TEAL
                              ? "rgba(66,222,195,0.1)"
                              : "rgba(255,107,107,0.1)",
                        }}
                      >
                        {diff > 0 ? "+" : ""}
                        {Math.round(diff * 10) / 10}
                      </span>
                    </div>
                  );
                })()}
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart
                    data={customData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                      tickLine={false}
                      axisLine={false}
                      width={45}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip content={<CustomTooltip unit={customUnit} />} />
                    <ReferenceLine
                      y={customData[0].value}
                      stroke="rgba(255,255,255,0.15)"
                      strokeDasharray="6 4"
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={getTrendColor(customData, customMetric)}
                      strokeWidth={2.5}
                      dot={{
                        r: 4,
                        fill: getTrendColor(customData, customMetric),
                        stroke: "rgba(6,20,35,0.8)",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: getTrendColor(customData, customMetric),
                        stroke: "rgba(6,20,35,0.8)",
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── PSE Bars ─── */}
      {sessions.length > 0 && (
        <Card className="bg-surface-container-low">
          <CardContent className="pt-0">
            <h3 className="font-display text-title-md text-on-surface mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Evolução da PSE (Borg)
            </h3>
            <div className="flex items-end gap-2 h-32">
              {sessions
                .filter((s) => (s.perceivedEffort ?? s.perceived_effort) != null)
                .reverse()
                .slice(-10)
                .map((session, idx) => {
                  const pse = (session.perceivedEffort ?? session.perceived_effort) ?? 6;
                  const percent = ((pse - 6) / 14) * 100;
                  const color =
                    pse >= 17
                      ? "bg-error"
                      : pse >= 13
                      ? "bg-warning"
                      : "bg-primary";
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-label-sm font-mono text-on-surface-variant">
                        {pse}
                      </span>
                      <div
                        className={`w-full rounded-t-md ${color} transition-all`}
                        style={{ height: `${Math.max(percent, 8)}%` }}
                      />
                      <span className="text-[10px] text-on-surface-variant/50">
                        {new Date(
                          session.sessionDate ?? session.session_date ?? ""
                        ).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
            </div>
            {sessions.filter((s) => (s.perceivedEffort ?? s.perceived_effort) != null)
              .length === 0 && (
              <p className="text-body-sm text-on-surface-variant/50 text-center italic py-4">
                Nenhuma PSE registrada ainda
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Recent Sessions ─── */}
      <Card className="bg-surface-container-low">
        <CardContent className="pt-0">
          <h3 className="font-display text-title-md text-on-surface mb-4">
            Sessões Recentes
          </h3>
          {sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.map((session) => {
                const exercises =
                  session.exercisesDone ?? session.exercises_done ?? [];
                const completed = exercises.filter(
                  (e: any) => e.completed
                ).length;
                const total = exercises.length;
                const pse =
                  session.perceivedEffort ?? session.perceived_effort;
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-surface-container rounded-xl"
                  >
                    <div>
                      <p className="text-body-sm text-on-surface">
                        {new Date(
                          session.sessionDate ?? session.session_date ?? ""
                        ).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                      {session.observations && (
                        <p className="text-label-sm text-on-surface-variant/60 mt-0.5 line-clamp-1">
                          {session.observations}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-body-sm text-primary">
                        {completed}/{total}
                      </span>
                      {pse != null && (
                        <span
                          className={`font-mono text-body-sm px-2 py-0.5 rounded-md ${
                            pse >= 17
                              ? "bg-error/10 text-error"
                              : pse >= 13
                              ? "bg-warning/10 text-warning"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          PSE {pse}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-body-sm text-on-surface-variant/50 text-center italic py-8">
              Nenhuma sessão registrada ainda. Use o botão &quot;Registrar
              Sessão&quot; para começar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Mini metric card ─── */
function MetricMini({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Card className="bg-surface-container-low">
      <CardContent className="pt-0 py-4">
        <div className="flex items-center gap-1.5 mb-2 text-on-surface-variant">
          {icon}
          <span className="text-label-sm">{label}</span>
        </div>
        <p className="font-mono text-title-lg text-on-surface">{value}</p>
        {subtitle && (
          <p className="text-label-sm text-on-surface-variant/50">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function getPSELabel(pse: number | null | undefined): string | undefined {
  if (pse == null) return undefined;
  if (pse >= 17) return "Muito intenso";
  if (pse >= 15) return "Intenso";
  if (pse >= 13) return "Moderado";
  if (pse >= 11) return "Leve";
  return "Muito leve";
}
