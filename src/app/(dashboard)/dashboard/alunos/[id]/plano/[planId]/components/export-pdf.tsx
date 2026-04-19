"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportPDFProps {
  studentName: string;
  studentAge?: number | null;
  studentConditions?: string[];
  professionalName?: string;
  professionalCref?: string;
  planSummary: string;
  planData: any;
  restrictions: any[];
  monitoringNotes: string[];
  assessmentProtocols?: string[];
}

/**
 * Gera um PDF formatado do plano de treino.
 * Tenta primeiro a rota server-side; se falhar, usa a Print API do navegador.
 */
export function ExportPDF({
  studentName,
  studentAge,
  studentConditions = [],
  professionalName,
  professionalCref,
  planSummary,
  planData,
  restrictions,
  monitoringNotes,
  assessmentProtocols = [],
}: ExportPDFProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    generatePrintPDF();
    setExporting(false);
  };

  function generatePrintPDF() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Permita pop-ups para exportar o PDF.");
      return;
    }

    const redFlags = restrictions.filter((r: any) => r.type === "red");
    const yellowFlags = restrictions.filter((r: any) => r.type === "yellow");
    const greenFlags = restrictions.filter((r: any) => r.type === "green");
    const generatedDate = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Plano de Treino - ${studentName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Segoe UI', -apple-system, sans-serif;
      color: #1a1a2e;
      padding: 40px 48px;
      max-width: 850px;
      margin: 0 auto;
      font-size: 13px;
      line-height: 1.5;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #42dec3;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .logo { font-size: 18px; color: #061423; font-weight: 800; letter-spacing: -0.5px; }
    .logo-sub { font-size: 11px; color: #42dec3; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; }
    .prof-info { text-align: right; font-size: 12px; color: #666; }
    .prof-name { font-weight: 600; color: #061423; }
    .prof-cref { font-family: monospace; color: #42dec3; font-weight: 600; }

    /* Student info */
    .student-box {
      background: #f7faf9;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .student-name { font-size: 18px; font-weight: 700; color: #061423; }
    .student-meta { font-size: 12px; color: #666; margin-top: 2px; }
    .student-conditions { display: flex; gap: 6px; flex-wrap: wrap; }
    .condition-badge {
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 20px;
      font-weight: 500;
    }
    .badge-red { background: #fff0f0; color: #c53030; }
    .badge-yellow { background: #fffbf0; color: #b7791f; }
    .badge-neutral { background: #f0f0f5; color: #555; }

    /* Headings */
    h2 {
      font-size: 16px;
      color: #061423;
      margin: 28px 0 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #42dec3;
      font-weight: 700;
    }
    h3 { font-size: 14px; color: #061423; margin: 16px 0 8px; }

    /* Exercise tables */
    .day-block { margin-bottom: 20px; page-break-inside: avoid; }
    .day-header {
      background: #061423;
      color: white;
      padding: 10px 16px;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .day-name { font-weight: 700; font-size: 14px; }
    .day-type { color: #42dec3; font-size: 12px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th {
      background: #f0f9f7;
      text-align: left;
      padding: 8px 10px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      font-weight: 600;
    }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
    td.mono { font-family: 'JetBrains Mono', monospace; color: #0d9488; font-weight: 600; }
    td.notes { font-size: 11px; color: #888; }
    tr:last-child td { border-bottom: none; }
    .table-wrap { border: 1px solid #e8e8e8; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden; }

    /* Restrictions */
    .alert { padding: 10px 14px; margin: 6px 0; border-radius: 8px; font-size: 12px; line-height: 1.5; }
    .alert-red { background: #fff5f5; border-left: 4px solid #e53e3e; }
    .alert-yellow { background: #fffff0; border-left: 4px solid #d69e2e; }
    .alert-green { background: #f0fff4; border-left: 4px solid #38a169; }
    .alert strong { display: block; margin-bottom: 2px; }

    /* Notes */
    .notes-list { padding-left: 16px; color: #555; }
    .notes-list li { margin: 6px 0; }

    /* Assessment protocols */
    .protocol { background: #f7f7ff; border-radius: 8px; padding: 12px 16px; margin: 6px 0; font-size: 12px; color: #555; }

    /* Footer */
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #999;
      font-size: 10px;
      border-top: 1px solid #ddd;
      padding-top: 16px;
    }
    .footer-warning {
      background: #fffbf0;
      border: 1px solid #f0e6d0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
      font-size: 11px;
      color: #92700c;
      text-align: center;
    }

    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
      .day-block { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div>
      <div class="logo">FisioMentor</div>
      <div class="logo-sub">Curador Clínico</div>
    </div>
    <div class="prof-info">
      ${professionalName ? `<div class="prof-name">${professionalName}</div>` : ""}
      ${professionalCref ? `<div class="prof-cref">CREF ${professionalCref}</div>` : ""}
      <div>Gerado em ${generatedDate}</div>
    </div>
  </div>

  <!-- Student Info -->
  <div class="student-box">
    <div>
      <div class="student-name">${studentName}</div>
      <div class="student-meta">
        ${studentAge ? `${studentAge} anos` : ""}
        ${planSummary ? ` · ${planSummary}` : ""}
      </div>
    </div>
    ${studentConditions.length > 0 ? `
    <div class="student-conditions">
      ${studentConditions.map((c) => {
        const colorClass = ["Cardiopatia", "DPOC", "AVC", "Insuficiência Cardíaca"].includes(c)
          ? "badge-red"
          : ["Diabetes T1", "Diabetes T2", "Hipertensão"].includes(c)
          ? "badge-yellow"
          : "badge-neutral";
        return `<span class="condition-badge ${colorClass}">${c}</span>`;
      }).join("")}
    </div>
    ` : ""}
  </div>

  <!-- Restrictions -->
  ${restrictions.length > 0 ? `
  <h2>⚕ Alertas Clínicos</h2>
  ${redFlags.map((r: any) => `
    <div class="alert alert-red">
      <strong>Contraindicação</strong>
      ${r.description}
      ${r.suggestion ? `<br><em>Recomendação: ${r.suggestion}</em>` : ""}
    </div>
  `).join("")}
  ${yellowFlags.map((r: any) => `
    <div class="alert alert-yellow">
      <strong>Cautela</strong>
      ${r.description}
      ${r.suggestion ? `<br><em>Recomendação: ${r.suggestion}</em>` : ""}
    </div>
  `).join("")}
  ${greenFlags.map((r: any) => `
    <div class="alert alert-green">
      <strong>Recomendação</strong>
      ${r.description}
    </div>
  `).join("")}
  ` : ""}

  <!-- Weekly Split -->
  <h2>📋 Programa Semanal</h2>
  ${(planData?.weekly_split ?? []).map((day: any) => `
    <div class="day-block">
      <div class="day-header">
        <span class="day-name">${day.day}</span>
        <span class="day-type">${day.session_type}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:32%">Exercício</th>
              <th style="width:10%">Séries</th>
              <th style="width:12%">Repetições</th>
              <th style="width:12%">Intervalo</th>
              <th style="width:16%">Carga Sugerida</th>
              <th style="width:18%">Observações</th>
            </tr>
          </thead>
          <tbody>
            ${(day.exercises ?? []).map((ex: any) => `
              <tr>
                <td><strong>${ex.name}</strong></td>
                <td class="mono">${ex.sets}</td>
                <td class="mono">${ex.reps}</td>
                <td class="mono">${ex.rest_seconds}s</td>
                <td>${ex.load_guidance}</td>
                <td class="notes">${ex.notes || "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `).join("")}

  <!-- Monitoring Notes -->
  ${monitoringNotes.length > 0 ? `
  <h2>🩺 Cuidados de Monitoramento</h2>
  <ul class="notes-list">
    ${monitoringNotes.map((n: string) => `<li>${n}</li>`).join("")}
  </ul>
  ` : ""}

  <!-- Assessment Protocols -->
  ${assessmentProtocols.length > 0 ? `
  <h2>📊 Protocolos de Avaliação Sugeridos</h2>
  ${assessmentProtocols.map((p: string) => `<div class="protocol">${p}</div>`).join("")}
  ` : ""}

  <!-- Footer -->
  <div class="footer-warning">
    ⚠️ Este plano foi gerado com auxílio de Inteligência Artificial e deve ser supervisionado
    por profissional de Educação Física habilitado. Não substitui avaliação médica.
  </div>
  <div class="footer">
    <p>FisioMentor — Curador Clínico · Prescrição inteligente para populações especiais</p>
    <p>${generatedDate}</p>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="gap-1"
    >
      {exporting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileDown className="h-3.5 w-3.5" />
      )}
      Exportar PDF
    </Button>
  );
}
