/**
 * Analisa a knowledge_base pra identificar chunks duplicados após o fix
 * de caracteres de controle (que alterou hashes).
 *
 * Uso: npx tsx server/scripts/check-duplicates.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    const total = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM knowledge_base`;
    console.log(`Total de chunks: ${total[0].n}\n`);

    // Chunks por fonte
    const bySource = await sql<{ source_name: string; n: number }[]>`
      SELECT source_name, COUNT(*)::int AS n
      FROM knowledge_base
      GROUP BY source_name
      ORDER BY n DESC
    `;
    console.log(`Fontes distintas: ${bySource.length}\n`);
    console.log("Top 10 fontes por nº de chunks:");
    for (const r of bySource.slice(0, 10)) {
      console.log(`  ${String(r.n).padStart(4)}  ${r.source_name}`);
    }

    // Heurística: chunks da mesma fonte com conteúdo muito parecido quando
    // normalizados (ignorando control chars residuais). Isso é aproximado.
    const dupes = await sql<{ source_name: string; normalized_len: number; n: number }[]>`
      SELECT source_name,
             LENGTH(content_chunk) AS normalized_len,
             COUNT(*)::int AS n
      FROM knowledge_base
      GROUP BY source_name, LENGTH(content_chunk)
      HAVING COUNT(*) > 1
      ORDER BY n DESC
      LIMIT 20
    `;
    console.log(`\nGrupos (source, length) com > 1 chunk (forte indício de duplicata):`);
    if (dupes.length === 0) {
      console.log("  nenhum");
    } else {
      for (const d of dupes) {
        console.log(`  ${String(d.n).padStart(3)}× len=${d.normalized_len}  ${d.source_name}`);
      }
    }
  } finally {
    await sql.end();
  }
}

main();
