/**
 * Lista todos os modelos disponíveis para a GEMINI_API_KEY configurada.
 * Mostra especialmente os que suportam embedContent (necessário pro RAG).
 *
 * Uso: npx tsx server/scripts/list-gemini-models.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY não configurada");
    process.exit(1);
  }

  // Tenta v1beta primeiro (que é o que o SDK 0.24.1 usa)
  for (const version of ["v1beta", "v1"]) {
    console.log(`\n═══ API ${version} ═══`);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`
      );
      if (!res.ok) {
        console.log(`  ❌ HTTP ${res.status}: ${await res.text()}`);
        continue;
      }
      const data = (await res.json()) as {
        models: {
          name: string;
          supportedGenerationMethods?: string[];
          inputTokenLimit?: number;
          outputTokenLimit?: number;
        }[];
      };

      const embedders = data.models.filter((m) =>
        m.supportedGenerationMethods?.includes("embedContent")
      );
      const generators = data.models.filter((m) =>
        m.supportedGenerationMethods?.includes("generateContent")
      );

      console.log(`  Embedding models (${embedders.length}):`);
      for (const m of embedders) {
        console.log(`    - ${m.name}`);
      }

      console.log(`  Generation models (${generators.length}):`);
      for (const m of generators.slice(0, 10)) {
        console.log(`    - ${m.name}`);
      }
      if (generators.length > 10) {
        console.log(`    ... e mais ${generators.length - 10}`);
      }
    } catch (err: any) {
      console.log(`  ❌ Erro: ${err.message}`);
    }
  }
}

main();
