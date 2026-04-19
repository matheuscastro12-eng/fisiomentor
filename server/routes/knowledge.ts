import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/auth";
import { ingestKnowledgeBase } from "../lib/rag-ingest";
import { queryClient } from "../lib/db";

export async function knowledgeRoutes(app: FastifyInstance) {
  // ─── POST /api/knowledge/ingest — Indexar base de conhecimento ───
  app.post(
    "/knowledge/ingest",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { forceReindex } = (request.body as any) ?? {};

      try {
        const result = await ingestKnowledgeBase({ forceReindex });
        return reply.send({
          message: "Ingestão concluída",
          ...result,
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({
          error: "Falha na ingestão da base de conhecimento",
          details: error.message,
        });
      }
    }
  );

  // ─── GET /api/knowledge/stats — Estatísticas da base ───
  app.get(
    "/knowledge/stats",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const categories = await queryClient`
        SELECT
          category,
          COUNT(*) as chunk_count,
          COUNT(embedding) as embedded_count,
          MAX(indexed_at) as last_indexed
        FROM knowledge_base
        GROUP BY category
        ORDER BY category
      `;

      const totalRows = await queryClient`
        SELECT COUNT(*) as total FROM knowledge_base
      `;

      return reply.send({
        total: Number(totalRows[0]?.total ?? 0),
        categories,
      });
    }
  );

  // ─── GET /api/knowledge/search — Busca vetorial (para debug/teste) ───
  app.get(
    "/knowledge/search",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { q, category, limit } = request.query as {
        q?: string;
        category?: string;
        limit?: string;
      };

      if (!q) {
        return reply.status(400).send({ error: "Parâmetro 'q' é obrigatório" });
      }

      // Import dinâmico para evitar dependência circular
      const { searchKnowledge } = await import(
        "../../src/lib/ai/vector-store"
      );

      const results = await searchKnowledge(q, {
        category,
        limit: limit ? parseInt(limit) : 5,
      });

      return reply.send({ query: q, results });
    }
  );
}
