/**
 * Apaga todos os chunks de knowledge_base. Use antes de uma re-ingestão limpa.
 *
 * Uso:
 *   npx tsx server/scripts/truncate-knowledge.ts          # dry-run
 *   npx tsx server/scripts/truncate-knowledge.ts --apply  # executa
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    const before = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM knowledge_base`;
    console.log(`Chunks atuais: ${before[0].n}`);

    if (!APPLY) {
      console.log(`\n⚠️  Dry-run. Para apagar TUDO, rode:`);
      console.log(`    npx tsx server/scripts/truncate-knowledge.ts --apply`);
      return;
    }

    console.log(`\n🧹 TRUNCATE knowledge_base...`);
    await sql`TRUNCATE TABLE knowledge_base`;
    const after = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM knowledge_base`;
    console.log(`✅ Base zerada. Chunks restantes: ${after[0].n}`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
