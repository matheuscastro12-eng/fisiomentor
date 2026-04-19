/**
 * Dry-run: lista todos os PDFs em "artigos jonas" e mostra qual categoria
 * o categorize() vai atribuir, separando os que vieram do mapa explícito
 * (✅ curado) dos que caíram no fallback de keywords (⚠️ heurística).
 *
 * Não chama Gemini, não toca no banco. Pode rodar à vontade.
 *
 * Uso: npx tsx server/scripts/check-categorization.ts
 */
import { readdirSync } from "fs";
import { join } from "path";

// NOTA: ingest-pdfs.ts roda main() no import, então não dá pra reaproveitar
// via require/import. A lógica abaixo é copiada — se editar uma, edite a outra.
const EXPLICIT_CATEGORIES: Record<string, string> = {
  "2020 ESC Guidelines on sports cardiology and exercise in patients with cardiovascular disease.pdf": "cardio",
  "AHA - Dislipidemia (2026).pdf": "cardio",
  "Hipertensão - ACC e AHA (2025).pdf": "cardio",
  "Physical activity policies forcardiovascular health.pdf": "cardio",
  "ACSM - Diabetes (2022).pdf": "metabolic",
  "Diabetes ADA (2026).pdf": "metabolic",
  "Disease and Obesity-Associated Complications - A Position.pdf": "metabolic",
  "Physical activity in metabolic syndrome.pdf": "metabolic",
  "Stine (2023) - Doença hepática gordurosa não alcoólica.pdf": "metabolic",
  "The Significant Role of Physical Activity and Exercise in Health and Metabolic Diseases.pdf": "metabolic",
  "Culvenor et al. (2022) - Lesão LCA e menisco.pdf": "ortho",
  "Current Research on Patellar Tendinopathy.pdf": "ortho",
  "Fontanier et al. (2025) - Lesão LCA (exercícios de cadeia cinética aberta).pdf": "ortho",
  "Hip Pain and Mobility Deficits—Hip Osteoarthritis Revision 2025.pdf": "ortho",
  "malliaras-et-al-2015-patellar-tendinopathy-clinical-diagnosis-load-management-and-advice-for-challenging-case.pdf": "ortho",
  "Exercise & Sports Science Australia (ESSA) position statement on exercise and chronic obstructive pulmonary disease.pdf": "pulmonary",
  "Diretrizes de treinamento físico para esclerose múltipla, acidente vascular cerebral e doença de Parkinson- revisão e síntese rápidas.pdf": "neuro",
  "Physical exercise for people with Parkinson’s disease-a systematic.pdf": "neuro",
  "Zhao et al. (2024) - Pós-AVC com comprometimento cognitivo.pdf": "neuro",
  "Balachandran et al. (2022) - Idoso.pdf": "elderly",
  "Diretrizes de atividade física para idosos - lacunas de conhecimento e perspectivas futuras..pdf": "elderly",
  "Posicionamento sobre Exercícios Físicos na Gestação e no.pdf": "pregnancy",
  "Traducao_PARmed_X_PARA_GESTACAO_Translat.pdf": "pregnancy",
  "healthcare- gestatnte.pdf": "pregnancy",
  "Critical Reviews in Oncology - Hematology.pdf": "oncology",
  "DIRETRIZES DA OMS criaaça e adolescente.pdf": "pediatric",
  "PRESCRIÇÃO criança e adolescente.pdf": "pediatric",
  "ACSM - Pessoas com deficiência (2025).pdf": "disability",
  "atividade física para PCD.pdf": "disability",
  "Physical activity should be the primary intervention for individuals living with chronic pain A position paper.pdf": "pain",
  "ACSM - Treinamento resistido (2026).pdf": "strength",
  "Grgic et al. (2022) - Repetições até a falha.pdf": "strength",
  "Grgicet al. (2017) - Tempo de intervalo entre séries.pdf": "strength",
  "Kassiano et al. (2022a) - Variação de exercícios (1).pdf": "strength",
  "Kassiano et al. (2022b) - Amplitude de movimento.pdf": "strength",
  "Lovegrove et al. (2021) - Repetições de reserva.pdf": "strength",
  "Nunes et al. (2021) - Ordem dos exercícios.pdf": "strength",
  "Schoenfeld et al. (2017) - Intensidade alta vs. baixa.pdf": "strength",
  "Schoenfeld et al. (2021) - Recomendações força, hipertrofia e resistência.pdf": "strength",
  "Schoenfeld, Grgic e Krieger (2018) - Frequência semanal.pdf": "strength",
  "Schoenfeld, Ogborn e Krieger (2016) - Volume semanal.pdf": "strength",
  "PARQ-site-CEPE.pdf": "screening",
  "Pre-exercise-screening-ebook_2025.pdf": "screening",
  "ACSM's.pdf": "guidelines",
  "Diretrizes Do Acsm decima edição.pdf": "guidelines",
  "Guia de Atividade Física para População Brasileira.pdf": "guidelines",
  "Projeto Prescrição de Exercícios para Populações Especiais.pdf": "guidelines",
  "acsm_expert_consensus_statement__considerations.24.pdf": "guidelines",
  "guia_AF_OMS.pdf": "guidelines",
  "Personalized exercise programs in.pdf": "general",
  "bmjsem-2021-001110.pdf": "general",
};

function categorizeByKeywords(filename: string): string {
  const f = filename.toLowerCase();
  if (/schoenfeld|grgic|kassiano|lovegrove|\bnunes\b|hipertrofia|resistido|resistance training|strength training|amplitude de movimento|repeti[cç][oõ]es|s[eé]ries|carga de treino/.test(f)) return "strength";
  if (/par-?q|parmed|pre-exercise screening|pre exercise screening|triagem pr[eé]/.test(f)) return "screening";
  if (/lca|menisco|tendinopath|patellar|hip pain|hip osteo|osteoarth|joelho|ombro|coluna|lombar|fratura|ortop|musculoesquel/.test(f)) return "ortho";
  if (/cardio|esc guidelines|\baha\b|\bacc\b|dislipidemia|hipertens|hypertension|insufici[eê]ncia card/.test(f)) return "cardio";
  if (/diabetes|obes|metabolic|metabol|hep[aá]t|gordurosa|nafld|s[ií]ndrome metab/.test(f)) return "metabolic";
  if (/dpoc|copd|pulmon|obstructive|asma|asthma|respirat/.test(f)) return "pulmonary";
  if (/parkinson|\bavc\b|stroke|esclerose|sclerosis|cognitivo|cognitive|alzheimer|demen|neuro/.test(f)) return "neuro";
  if (/idoso|aging|older|elderly|geri[aá]t|sarcopen/.test(f)) return "elderly";
  if (/gesta[cç][aã]o|gestante|pregnancy|prenatal|grav[ií]dez|p[oó]s-?parto|postpartum/.test(f)) return "pregnancy";
  if (/oncolog|cancer|c[aâ]ncer|hematol|tumor|quimioter|radioter/.test(f)) return "oncology";
  if (/crian[cç]a|adolescente|child|pediatric|adolescent|jovem/.test(f)) return "pediatric";
  if (/defici[eê]ncia|\bpcd\b|disabilit|cadeirante/.test(f)) return "disability";
  if (/dor cr[oô]nica|chronic pain|\bdor\b|\bpain\b|fibromialg/.test(f)) return "pain";
  if (/acsm|diretrizes|\bguia\b|\boms\b|\bwho\b|guideline|posicionamento|consensus|consenso/.test(f)) return "guidelines";
  return "general";
}

// ─── Dry-run ───
const PDF_DIR = join(__dirname, "../../artigos jonas");
const files = readdirSync(PDF_DIR).filter((f) => f.toLowerCase().endsWith(".pdf"));

const explicit: { file: string; cat: string }[] = [];
const fallback: { file: string; cat: string }[] = [];

for (const f of files) {
  if (EXPLICIT_CATEGORIES[f]) {
    explicit.push({ file: f, cat: EXPLICIT_CATEGORIES[f] });
  } else {
    fallback.push({ file: f, cat: categorizeByKeywords(f) });
  }
}

// Detectar entradas no mapa que não correspondem a nenhum arquivo (typos)
const filesSet = new Set(files);
const orphans = Object.keys(EXPLICIT_CATEGORIES).filter((k) => !filesSet.has(k));

console.log(`📁 ${files.length} PDFs em "${PDF_DIR}"\n`);

console.log(`✅ Mapa explícito: ${explicit.length} arquivos`);
const byCat: Record<string, number> = {};
for (const e of [...explicit, ...fallback]) {
  byCat[e.cat] = (byCat[e.cat] ?? 0) + 1;
}
console.log("   Distribuição final:");
for (const [cat, n] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
  console.log(`     ${cat.padEnd(12)} ${n}`);
}

if (fallback.length > 0) {
  console.log(`\n⚠️  Caíram no fallback de keywords (${fallback.length}):`);
  for (const f of fallback) {
    console.log(`   [${f.cat}] ${f.file}`);
  }
}

if (orphans.length > 0) {
  console.log(`\n❌ Entradas no mapa SEM arquivo correspondente (typo?): ${orphans.length}`);
  for (const o of orphans) {
    console.log(`   ${o}`);
  }
  process.exit(1);
}

console.log(`\n✅ Tudo certo. Pronto pra rodar 'npm run rag:ingest-pdfs'.`);
