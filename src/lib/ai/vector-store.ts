import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateEmbedding } from "./gemini";

export interface KnowledgeChunk {
  id: string;
  source_name: string;
  category: string;
  content_chunk: string;
  similarity: number;
}

/**
 * Busca vetorial por similaridade coseno na knowledge_base.
 * Retorna os `limit` chunks mais relevantes para a query.
 */
export async function searchKnowledge(
  query: string,
  options: {
    category?: string;
    limit?: number;
    threshold?: number;
  } = {}
): Promise<KnowledgeChunk[]> {
  const { category, limit = 8, threshold = 0.3 } = options;

  const embedding = await generateEmbedding(query);
  const supabase = createServerSupabaseClient();

  // Usar RPC para busca vetorial com pgvector
  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
    filter_category: category ?? null,
  });

  if (error) {
    console.error("Erro na busca vetorial:", error);
    return [];
  }

  return (data as KnowledgeChunk[]) ?? [];
}

/**
 * Busca conhecimento contextualizado para um perfil clínico específico.
 * Combina múltiplas queries para cobrir diagnósticos, medicamentos e objetivos.
 */
export async function searchContextForStudent(params: {
  diagnoses: string[];
  medications: string[];
  goals: string[];
  experienceLevel: string;
  cardiovascularRisk?: string;
}): Promise<KnowledgeChunk[]> {
  const queries: string[] = [];

  // Query para cada diagnóstico
  for (const diag of params.diagnoses) {
    queries.push(
      `Diretrizes de exercício para paciente com ${diag}. Contraindicações, cuidados e progressão.`
    );
  }

  // Query para interações medicamentosas
  if (params.medications.length > 0) {
    queries.push(
      `Efeitos de medicamentos no exercício: ${params.medications.join(", ")}. Ajustes de prescrição.`
    );
  }

  // Query para objetivos de treino
  if (params.goals.length > 0) {
    queries.push(
      `Prescrição de exercício para ${params.goals.join(", ")} em nível ${params.experienceLevel}.`
    );
  }

  // Query para risco cardiovascular
  if (params.cardiovascularRisk && params.cardiovascularRisk !== "baixo") {
    queries.push(
      `Risco cardiovascular ${params.cardiovascularRisk}: limites de intensidade, monitoramento e sinais de alerta.`
    );
  }

  // Executar todas as buscas em paralelo e deduplicar
  const results = await Promise.all(
    queries.map((q) => searchKnowledge(q, { limit: 5 }))
  );

  const seen = new Set<string>();
  const merged: KnowledgeChunk[] = [];

  for (const chunks of results) {
    for (const chunk of chunks) {
      if (!seen.has(chunk.id)) {
        seen.add(chunk.id);
        merged.push(chunk);
      }
    }
  }

  // Ordenar por similaridade decrescente e limitar
  return merged.sort((a, b) => b.similarity - a.similarity).slice(0, 15);
}
