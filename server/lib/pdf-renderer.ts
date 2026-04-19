/**
 * Server-side PDF HTML generator for training plans.
 * Generates a complete HTML document that can be served as content-type text/html
 * for browser-based PDF printing, or consumed by a PDF conversion tool.
 */

interface PlanPdfInput {
  professionalName: string;
  professionalCref: string | null;
  studentName: string;
  studentAge: number | null;
  studentConditions: string[];
  planSummary: string | null;
  planData: any;
  restrictions: any[];
  monitoringNotes: string[];
  assessmentProtocols: string[];
  generatedAt: string;
}

const CONDITION_COLORS: Record<string, string> = {
  Cardiopatia: "badge-red",
  "Insuficiência Cardíaca": "badge-red",
  DPOC: "badge-red",
  AVC: "badge-red",
  "Diabetes T1": "badge-yellow",
  "Diabetes T2": "badge-yellow",
  Hipertensão: "badge-yellow",
  Obesidade: "badge-yellow",
};

export function generatePlanPdfHtml(input: PlanPdfInput): string {
  const {
    professionalName,
    professionalCref,
    studentName,
    studentAge,
    studentConditions,
    planSummary,
    planData,
    restrictions,
    monitoringNotes,
    assessmentProtocols,
    generatedAt,
  } = input;

  const redFlags = restrictions.filter((r) => r.type === "red");
  const yellowFlags = restrictions.filter((r) => r.type === "yellow");
  const greenFlags = restrictions.filter((r) => r.type === "green");

  const formattedDate = new Date(generatedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plano de Treino - ${studentName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Segoe UI', -apple-system, sans-serif;
      color: #1a1a2e; padding: 40px 48px; max-width: 850px;
      margin: 0 auto; font-size: 13px; line-height: 1.5;
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 2px solid #42dec3; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 18px; color: #061423; font-weight: 800; }
    .logo-sub { font-size: 11px; color: #42dec3; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; }
    .prof-info { text-align: right; font-size: 12px; color: #666; }
    .prof-name { font-weight: 600; color: #061423; }
    .prof-cref { font-family: monospace; color: #42dec3; font-weight: 600; }
    .student-box { background: #f7faf9; border-radius: 10px; padding: 16px 20px;
      margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .student-name { font-size: 18px; font-weight: 700; color: #061423; }
    .student-meta { font-size: 12px; color: #666; margin-top: 2px; }
    .student-conditions { display: flex; gap: 6px; flex-wrap: wrap; }
    .condition-badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 500; }
    .badge-red { background: #fff0f0; color: #c53030; }
    .badge-yellow { background: #fffbf0; color: #b7791f; }
    .badge-neutral { background: #f0f0f5; color: #555; }
    h2 { font-size: 16px; color: #061423; margin: 28px 0 12px; padding-bottom: 6px;
      border-bottom: 2px solid #42dec3; font-weight: 700; }
    .day-block { margin-bottom: 20px; page-break-inside: avoid; }
    .day-header { background: #061423; color: white; padding: 10px 16px;
      border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; }
    .day-name { font-weight: 700; font-size: 14px; }
    .day-type { color: #42dec3; font-size: 12px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f0f9f7; text-align: left; padding: 8px 10px; font-size: 10px;
      text-transform: uppercase; letter-spacing: 0.5px; color: #666; font-weight: 600; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
    td.mono { font-family: monospace; color: #0d9488; font-weight: 600; }
    .table-wrap { border: 1px solid #e8e8e8; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden; }
    .alert { padding: 10px 14px; margin: 6px 0; border-radius: 8px; font-size: 12px; }
    .alert-red { background: #fff5f5; border-left: 4px solid #e53e3e; }
    .alert-yellow { background: #fffff0; border-left: 4px solid #d69e2e; }
    .alert-green { background: #f0fff4; border-left: 4px solid #38a169; }
    .alert strong { display: block; margin-bottom: 2px; }
    .notes-list { padding-left: 16px; color: #555; }
    .notes-list li { margin: 6px 0; }
    .footer-warning { background: #fffbf0; border: 1px solid #f0e6d0; border-radius: 8px;
      padding: 12px 16px; margin-top: 32px; font-size: 11px; color: #92700c; text-align: center; }
    .footer { margin-top: 16px; text-align: center; color: #999; font-size: 10px;
      border-top: 1px solid #ddd; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">FisioMentor</div>
      <div class="logo-sub">Curador Clínico</div>
    </div>
    <div class="prof-info">
      <div class="prof-name">${esc(professionalName)}</div>
      ${professionalCref ? `<div class="prof-cref">CREF ${esc(professionalCref)}</div>` : ""}
      <div>Gerado em ${formattedDate}</div>
    </div>
  </div>

  <div class="student-box">
    <div>
      <div class="student-name">${esc(studentName)}</div>
      <div class="student-meta">
        ${studentAge ? `${studentAge} anos` : ""}${planSummary ? ` · ${esc(planSummary)}` : ""}
      </div>
    </div>
    ${
      studentConditions.length > 0
        ? `<div class="student-conditions">${studentConditions
            .map(
              (c) =>
                `<span class="condition-badge ${CONDITION_COLORS[c] ?? "badge-neutral"}">${esc(c)}</span>`
            )
            .join("")}</div>`
        : ""
    }
  </div>

  ${
    restrictions.length > 0
      ? `<h2>Alertas Clínicos</h2>
    ${redFlags.map((r) => `<div class="alert alert-red"><strong>Contraindicação</strong>${esc(r.description)}</div>`).join("")}
    ${yellowFlags.map((r) => `<div class="alert alert-yellow"><strong>Cautela</strong>${esc(r.description)}</div>`).join("")}
    ${greenFlags.map((r) => `<div class="alert alert-green"><strong>Recomendação</strong>${esc(r.description)}</div>`).join("")}`
      : ""
  }

  <h2>Programa Semanal</h2>
  ${(planData?.weekly_split ?? [])
    .map(
      (day: any) => `
    <div class="day-block">
      <div class="day-header">
        <span class="day-name">${esc(day.day)}</span>
        <span class="day-type">${esc(day.session_type)}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th style="width:32%">Exercício</th>
            <th style="width:10%">Séries</th>
            <th style="width:12%">Repetições</th>
            <th style="width:12%">Intervalo</th>
            <th style="width:16%">Carga Sugerida</th>
            <th style="width:18%">Observações</th>
          </tr></thead>
          <tbody>
            ${(day.exercises ?? [])
              .map(
                (ex: any) => `<tr>
                <td><strong>${esc(ex.name)}</strong></td>
                <td class="mono">${ex.sets}</td>
                <td class="mono">${esc(ex.reps)}</td>
                <td class="mono">${ex.rest_seconds}s</td>
                <td>${esc(ex.load_guidance)}</td>
                <td style="font-size:11px;color:#888">${esc(ex.notes || "—")}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`
    )
    .join("")}

  ${
    monitoringNotes.length > 0
      ? `<h2>Cuidados de Monitoramento</h2>
    <ul class="notes-list">${monitoringNotes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`
      : ""
  }

  ${
    assessmentProtocols.length > 0
      ? `<h2>Protocolos de Avaliação Sugeridos</h2>
    ${assessmentProtocols.map((p) => `<div style="background:#f7f7ff;border-radius:8px;padding:12px 16px;margin:6px 0;font-size:12px;color:#555">${esc(p)}</div>`).join("")}`
      : ""
  }

  <div class="footer-warning">
    Este plano foi gerado com auxílio de Inteligência Artificial e deve ser supervisionado
    por profissional de Educação Física habilitado. Não substitui avaliação médica.
  </div>
  <div class="footer">
    <p>FisioMentor — Curador Clínico · ${formattedDate}</p>
  </div>
</body>
</html>`;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
