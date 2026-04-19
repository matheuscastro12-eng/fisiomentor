import { createHash } from "crypto";
import { queryClient } from "./db";
import { KNOWLEDGE_CHUNKS, type KnowledgeEntry } from "./knowledge-chunks";
import { generateEmbeddingsBatch } from "../../src/lib/ai/gemini";

/**
 * Pipeline de ingestão da base de conhecimento.
 * Gera embeddings e insere/atualiza chunks na tabela knowledge_base.
 */
export async function ingestKnowledgeBase(options?: {
  batchSize?: number;
  forceReindex?: boolean;
}) {
  const { batchSize = 20, forceReindex = false } = options ?? {};

  console.log(
    `📚 Iniciando ingestão de ${KNOWLEDGE_CHUNKS.length} chunks...`
  );

  // Calcular hashes para detectar mudanças
  const chunksWithHash = KNOWLEDGE_CHUNKS.map((chunk) => ({
    ...chunk,
    content_hash: createHash("md5").update(chunk.content_chunk).digest("hex"),
  }));

  // Verificar quais hashes já existem no banco
  let existingHashes = new Set<string>();
  if (!forceReindex) {
    const rows = await queryClient`SELECT content_hash FROM knowledge_base`;
    existingHashes = new Set(rows.map((r: any) => r.content_hash));
  }

  // Filtrar apenas chunks novos ou modificados
  const newChunks = chunksWithHash.filter(
    (c) => !existingHashes.has(c.content_hash)
  );

  if (newChunks.length === 0) {
    console.log("✅ Base de conhecimento já está atualizada.");
    return { inserted: 0, total: KNOWLEDGE_CHUNKS.length };
  }

  console.log(`🔄 ${newChunks.length} chunks novos/modificados para indexar.`);

  let inserted = 0;

  // Processar em batches para não exceder limites da API
  for (let i = 0; i < newChunks.length; i += batchSize) {
    const batch = newChunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.content_chunk);

    console.log(
      `  📦 Gerando embeddings para batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newChunks.length / batchSize)}...`
    );

    // Gerar embeddings em batch
    const embeddings = await generateEmbeddingsBatch(texts);

    // Inserir no banco
    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      const embedding = embeddings[j];
      const embeddingStr = `[${embedding.join(",")}]`;

      await queryClient`
        INSERT INTO knowledge_base (source_name, category, content_hash, content_chunk, embedding)
        VALUES (${chunk.source_name}, ${chunk.category}, ${chunk.content_hash}, ${chunk.content_chunk}, ${embeddingStr}::vector)
        ON CONFLICT (content_hash) DO UPDATE SET
          content_chunk = EXCLUDED.content_chunk,
          embedding = EXCLUDED.embedding,
          indexed_at = NOW()
      `;
      inserted++;
    }
  }

  console.log(
    `✅ Ingestão concluída: ${inserted} chunks inseridos/atualizados.`
  );
  return { inserted, total: KNOWLEDGE_CHUNKS.length };
}
