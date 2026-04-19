/**
 * Script para ingestão de PDFs na base de conhecimento RAG.
 * Extrai texto, chunka, categoriza, gera embeddings e insere no pgvector.
 *
 * Uso: npx tsx server/scripts/ingest-pdfs.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createHash } from "crypto";
import { readFileSync, readdirSync } from "fs";
import { join, basename } from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdf = require("pdf-parse");
import postgres from "postgres";

// ─── Config ───
const PDF_DIR = join(__dirname, "../../artigos jonas");
const CHUNK_SIZE = 800; // tokens (~words)
const CHUNK_OVERLAP = 100;
const BATCH_SIZE = 15;
// `text-embedding-004` foi descontinuado; usamos `gemini-embedding-001` com
// outputDimensionality=768 pra bater com a coluna VECTOR(768) do banco.
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

async function embedText(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: text.replace(/\n/g, " ").trim() }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Embedding API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { embedding: { values: number[] } };
  return data.embedding.values;
}

// ─── Category mapping ───
//
// Estratégia em duas camadas:
// 1. EXPLICIT_CATEGORIES — mapa curado manualmente por nome de arquivo.
//    100% preciso. Adicione aqui sempre que um PDF novo for incluído.
// 2. categorizeByKeywords() — fallback heurístico por palavras-chave,
//    usado apenas pra arquivos que ainda não estão no mapa explícito.
//
// Categorias usadas pelo RAG:
//   cardio, metabolic, ortho, pulmonary, neuro, elderly, pregnancy,
//   oncology, pediatric, disability, pain, strength, screening,
//   guidelines, general
//
const EXPLICIT_CATEGORIES: Record<string, string> = {
  // ── cardio ──
  "2020 ESC Guidelines on sports cardiology and exercise in patients with cardiovascular disease.pdf": "cardio",
  "AHA - Dislipidemia (2026).pdf": "cardio",
  "Hipertensão - ACC e AHA (2025).pdf": "cardio",
  "Physical activity policies forcardiovascular health.pdf": "cardio",

  // ── metabolic ──
  "ACSM - Diabetes (2022).pdf": "metabolic",
  "Diabetes ADA (2026).pdf": "metabolic",
  "Disease and Obesity-Associated Complications - A Position.pdf": "metabolic",
  "Physical activity in metabolic syndrome.pdf": "metabolic",
  "Stine (2023) - Doença hepática gordurosa não alcoólica.pdf": "metabolic",
  "The Significant Role of Physical Activity and Exercise in Health and Metabolic Diseases.pdf": "metabolic",

  // ── ortho (lesões e patologias musculoesqueléticas) ──
  "Culvenor et al. (2022) - Lesão LCA e menisco.pdf": "ortho",
  "Current Research on Patellar Tendinopathy.pdf": "ortho",
  "Fontanier et al. (2025) - Lesão LCA (exercícios de cadeia cinética aberta).pdf": "ortho",
  "Hip Pain and Mobility Deficits—Hip Osteoarthritis Revision 2025.pdf": "ortho",
  "malliaras-et-al-2015-patellar-tendinopathy-clinical-diagnosis-load-management-and-advice-for-challenging-case.pdf": "ortho",

  // ── pulmonary ──
  "Exercise & Sports Science Australia (ESSA) position statement on exercise and chronic obstructive pulmonary disease.pdf": "pulmonary",

  // ── neuro ──
  "Diretrizes de treinamento físico para esclerose múltipla, acidente vascular cerebral e doença de Parkinson- revisão e síntese rápidas.pdf": "neuro",
  "Physical exercise for people with Parkinson’s disease-a systematic.pdf": "neuro",
  "Zhao et al. (2024) - Pós-AVC com comprometimento cognitivo.pdf": "neuro",

  // ── elderly ──
  "Balachandran et al. (2022) - Idoso.pdf": "elderly",
  "Diretrizes de atividade física para idosos - lacunas de conhecimento e perspectivas futuras..pdf": "elderly",

  // ── pregnancy ──
  "Posicionamento sobre Exercícios Físicos na Gestação e no.pdf": "pregnancy",
  "Traducao_PARmed_X_PARA_GESTACAO_Translat.pdf": "pregnancy",
  "healthcare- gestatnte.pdf": "pregnancy",

  // ── oncology ──
  "Critical Reviews in Oncology - Hematology.pdf": "oncology",

  // ── pediatric ──
  "DIRETRIZES DA OMS criaaça e adolescente.pdf": "pediatric",
  "PRESCRIÇÃO criança e adolescente.pdf": "pediatric",

  // ── disability ──
  "ACSM - Pessoas com deficiência (2025).pdf": "disability",
  "atividade física para PCD.pdf": "disability",

  // ── pain ──
  "Physical activity should be the primary intervention for individuals living with chronic pain A position paper.pdf": "pain",

  // ── strength (pesquisa em treinamento de força/hipertrofia) ──
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

  // ── screening (PAR-Q e ferramentas de triagem pré-exercício) ──
  "PARQ-site-CEPE.pdf": "screening",
  "Pre-exercise-screening-ebook_2025.pdf": "screening",

  // ── guidelines (diretrizes amplas/multitemáticas) ──
  "ACSM's.pdf": "guidelines",
  "Diretrizes Do Acsm decima edição.pdf": "guidelines",
  "Guia de Atividade Física para População Brasileira.pdf": "guidelines",
  "Projeto Prescrição de Exercícios para Populações Especiais.pdf": "guidelines",
  "acsm_expert_consensus_statement__considerations.24.pdf": "guidelines",
  "guia_AF_OMS.pdf": "guidelines",

  // ── general (sem categoria clara só pelo nome) ──
  "Personalized exercise programs in.pdf": "general",
  "bmjsem-2021-001110.pdf": "general",
};

// Fallback heurístico para PDFs ainda não mapeados explicitamente.
// A ordem dos `if` importa: padrões mais específicos vêm antes dos genéricos
// (ex.: "schoenfeld" → strength precisa vir antes de "acsm" → guidelines).
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

function categorize(filename: string): string {
  return EXPLICIT_CATEGORIES[filename] ?? categorizeByKeywords(filename);
}

// ─── Text chunking ───
function chunkText(text: string, sourceName: string): { content: string; source: string }[] {
  // Clean text
  // - Remove NUL bytes (\x00): pdf-parse às vezes os emite quando o PDF tem
  //   fontes embutidas estranhas, e PostgreSQL rejeita NUL em colunas TEXT
  //   ("invalid byte sequence for encoding UTF8: 0x00").
  // - Remove outros caracteres de controle invisíveis (exceto \n, \r, \t).
  const cleaned = text
    .replace(/\x00/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")
    .trim();

  const words = cleaned.split(/\s+/);
  const chunks: { content: string; source: string }[] = [];

  for (let i = 0; i < words.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(" ");
    if (chunk.length > 100) { // Skip tiny chunks
      chunks.push({ content: chunk, source: sourceName });
    }
  }

  return chunks;
}

// ─── Main ───
async function main() {
  console.log("🧠 FisioMentor — Ingestão de PDFs para RAG\n");

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY não configurada em .env.local");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada em .env.local");
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;

  const sql = postgres(process.env.DATABASE_URL, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  // 1. List PDFs
  const files = readdirSync(PDF_DIR).filter((f) => f.toLowerCase().endsWith(".pdf"));
  console.log(`📁 ${files.length} PDFs encontrados em "${PDF_DIR}"\n`);

  let totalChunks = 0;
  let totalInserted = 0;

  // Get existing hashes
  const existingRows = await sql`SELECT content_hash FROM knowledge_base`;
  const existingHashes = new Set(existingRows.map((r: any) => r.content_hash));
  console.log(`📊 ${existingHashes.size} chunks já existem no banco\n`);

  for (const file of files) {
    const filepath = join(PDF_DIR, file);
    const sourceName = basename(file, ".pdf");
    const category = categorize(file);

    console.log(`📄 Processando: ${file}`);
    console.log(`   Categoria: ${category}`);

    try {
      // 2. Extract text
      const buffer = readFileSync(filepath);
      const data = await pdf(buffer);
      const text = data.text;

      if (!text || text.length < 200) {
        console.log(`   ⚠️  Texto muito curto (${text?.length ?? 0} chars), pulando...\n`);
        continue;
      }

      // 3. Chunk
      const chunks = chunkText(text, sourceName);
      console.log(`   📦 ${chunks.length} chunks gerados (${text.length} chars total)`);
      totalChunks += chunks.length;

      // 4. Filter new chunks only
      const newChunks = chunks.filter((c) => {
        const hash = createHash("md5").update(c.content).digest("hex");
        return !existingHashes.has(hash);
      });

      if (newChunks.length === 0) {
        console.log(`   ✅ Todos os chunks já estão indexados\n`);
        continue;
      }

      console.log(`   🔄 ${newChunks.length} chunks novos para indexar`);

      // 5. Generate embeddings and insert in batches
      for (let i = 0; i < newChunks.length; i += BATCH_SIZE) {
        const batch = newChunks.slice(i, i + BATCH_SIZE);

        // Generate embeddings (REST direto — ver embedText())
        const embeddings = await Promise.all(
          batch.map((c) => embedText(c.content, apiKey))
        );

        // Insert into DB
        for (let j = 0; j < batch.length; j++) {
          const chunk = batch[j];
          const embedding = embeddings[j];
          const hash = createHash("md5").update(chunk.content).digest("hex");
          const embeddingStr = `[${embedding.join(",")}]`;

          await sql`
            INSERT INTO knowledge_base (source_name, category, content_hash, content_chunk, embedding)
            VALUES (${sourceName}, ${category}, ${hash}, ${chunk.content}, ${embeddingStr}::vector)
            ON CONFLICT (content_hash) DO UPDATE SET
              content_chunk = EXCLUDED.content_chunk,
              embedding = EXCLUDED.embedding,
              indexed_at = NOW()
          `;
          totalInserted++;
          existingHashes.add(hash);
        }

        // Rate limit: small delay between batches
        if (i + BATCH_SIZE < newChunks.length) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      console.log(`   ✅ Inseridos\n`);
    } catch (error: any) {
      console.error(`   ❌ Erro: ${error.message}\n`);
    }
  }

  console.log(`\n${"═".repeat(50)}`);
  console.log(`📊 Resultado:`);
  console.log(`   - PDFs processados: ${files.length}`);
  console.log(`   - Total de chunks: ${totalChunks}`);
  console.log(`   - Chunks inseridos: ${totalInserted}`);
  console.log(`   - Total na base: ${existingHashes.size}`);
  console.log(`\n✅ Ingestão concluída!`);

  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
