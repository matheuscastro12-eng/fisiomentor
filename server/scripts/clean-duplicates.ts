/**
 * Remove chunks "sujos" da knowledge_base — aqueles que ainda contêm
 * caracteres de controle (NUL, etc.) da primeira rodada de ingestão,
 * antes do fix em chunkText().
 *
 * Os chunks "limpos" (gerados após o fix) sobrevivem porque não casam
 * com o regex de control chars.
 *
 * Uso:
 *   npx tsx server/scripts/clean-duplicates.ts          # dry-run (só conta)
 *   npx tsx server/scripts/clean-duplicates.ts --apply  # executa o DELETE
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    // Padrão PostgreSQL pra caracteres de controle: chr(0..8, 11, 12, 14..31, 127)
    // Usamos ~* (regex) no content_chunk.
    const dirtyPattern = "[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]";

    const before = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM knowledge_base`;
    const dirty = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM knowledge_base
      WHERE content_chunk ~ ${dirtyPattern}
    `;
    const clean = before[0].n - dirty[0].n;

    console.log(`Base atual:  ${before[0].n} chunks`);
    console.log(`  ✅ limpos:  ${clean}`);
    console.log(`  ❌ sujos:   ${dirty[0].n}\n`);

    // Mostra distribuição dos sujos por fonte
    const dirtyBySource = await sql<{ source_name: string; n: number }[]>`
      SELECT source_name, COUNT(*)::int AS n FROM knowledge_base
      WHERE content_chunk ~ ${dirtyPattern}
      GROUP BY source_name
      ORDER BY n DESC
    `;
    console.log(`Fontes afetadas (${dirtyBySource.length}):`);
    for (const r of dirtyBySource) {
      console.log(`  ${String(r.n).padStart(4)}  ${r.source_name}`);
    }

    if (!APPLY) {
      console.log(`\n⚠️  Dry-run. Para aplicar o DELETE, rode:`);
      console.log(`    npx tsx server/scripts/clean-duplicates.ts --apply`);
      return;
    }

    console.log(`\n🧹 Deletando ${dirty[0].n} chunks sujos...`);
    const result = await sql`
      DELETE FROM knowledge_base WHERE content_chunk ~ ${dirtyPattern}
    `;
    const after = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM knowledge_base`;
    console.log(`✅ Deletados: ${result.count}`);
    console.log(`Base final:  ${after[0].n} chunks`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
