/**
 * Script para ingestão da base de conhecimento RAG.
 * Gera embeddings para todas as diretrizes clínicas e indexa no pgvector.
 *
 * Uso: npx tsx server/scripts/ingest-knowledge.ts [--force]
 */
import "dotenv/config";
import { ingestKnowledgeBase } from "../lib/rag-ingest";

const forceReindex = process.argv.includes("--force");

async function main() {
  console.log("🧠 FisioMentor — Ingestão de Base de Conhecimento RAG\n");

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY não configurada em .env.local");
    console.error("   Configure sua chave do Google Gemini antes de executar este script.");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("COLE_SUA")) {
    console.error("❌ DATABASE_URL não configurada em .env.local");
    process.exit(1);
  }

  try {
    const result = await ingestKnowledgeBase({ forceReindex });
    console.log(`\n📊 Resultado:`);
    console.log(`   - Chunks inseridos/atualizados: ${result.inserted}`);
    console.log(`   - Total na base: ${result.total}`);
    console.log("\n✅ Pronto! A base de conhecimento está indexada.");
  } catch (error) {
    console.error("❌ Erro durante a ingestão:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
