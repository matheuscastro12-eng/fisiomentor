/**
 * Smoke test: gera 1 embedding e valida dimensões.
 * Uso: npx tsx server/scripts/test-embedding.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY não configurada");
    process.exit(1);
  }

  console.log(`Modelo: ${EMBEDDING_MODEL}`);
  console.log(`Dimensões esperadas: ${EMBEDDING_DIMENSIONS}\n`);

  const text = "Treinamento de força em pacientes com hipertensão arterial.";
  const t0 = Date.now();

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    }
  );

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status}`);
    console.error(await res.text());
    process.exit(1);
  }

  const data = (await res.json()) as { embedding: { values: number[] } };
  const dims = data.embedding.values.length;
  const elapsed = Date.now() - t0;

  console.log(`✅ ${dims} dims em ${elapsed}ms`);
  console.log(`   Preview: [${data.embedding.values.slice(0, 4).map((v) => v.toFixed(4)).join(", ")}...]`);

  if (dims !== EMBEDDING_DIMENSIONS) {
    console.error(`\n❌ DIMENSÃO INESPERADA: ${dims} (queria ${EMBEDDING_DIMENSIONS})`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
