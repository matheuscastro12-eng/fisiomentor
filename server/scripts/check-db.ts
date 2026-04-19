/**
 * Verifica o estado das tabelas do FisioMentor no Supabase.
 * Uso: npx tsx server/scripts/check-db.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada");
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
  });

  try {
    // 1. pgvector?
    const ext = await sql<{ extname: string }[]>`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `;
    console.log(`pgvector: ${ext.length > 0 ? "✅ instalada" : "❌ NÃO instalada"}`);

    // 2. tabelas esperadas
    const expected = [
      "professionals",
      "students",
      "health_profiles",
      "training_preferences",
      "physical_assessments",
      "training_plans",
      "training_sessions",
      "progress_records",
      "knowledge_base",
    ];
    const rows = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY(${expected})
    `;
    const present = new Set(rows.map((r) => r.table_name));

    console.log("\nTabelas:");
    for (const t of expected) {
      console.log(`  ${present.has(t) ? "✅" : "❌"} ${t}`);
    }

    // 3. knowledge_base já tem dados?
    if (present.has("knowledge_base")) {
      const count = await sql<{ count: number; sources: number }[]>`
        SELECT COUNT(*)::int AS count, COUNT(DISTINCT source_name)::int AS sources
        FROM knowledge_base
      `;
      console.log(
        `\nknowledge_base: ${count[0].count} chunks de ${count[0].sources} fontes`
      );

      if (count[0].sources > 0) {
        const sources = await sql<{ source_name: string; n: number }[]>`
          SELECT source_name, COUNT(*)::int AS n
          FROM knowledge_base
          GROUP BY source_name
          ORDER BY source_name
        `;
        console.log("\nFontes já indexadas:");
        for (const s of sources) console.log(`  - ${s.source_name} (${s.n} chunks)`);
      }
    }
  } catch (err: any) {
    console.error("❌ Erro:", err.message);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
