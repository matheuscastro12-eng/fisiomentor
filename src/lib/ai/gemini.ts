import { GoogleGenerativeAI } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_client) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn(
        "⚠️  GEMINI_API_KEY não configurada — geração de treino e embeddings desabilitados."
      );
    }
    _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
  }
  return _client;
}

export const GENERATION_MODEL = "gemini-2.0-flash";
// `text-embedding-004` foi descontinuado pela Google. O sucessor é
// `gemini-embedding-001`, que retorna 3072 dims por padrão mas aceita o
// parâmetro `outputDimensionality` pra reduzir. Mantemos 768 pra não quebrar
// a coluna VECTOR(768) já existente em knowledge_base.
export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Gera texto usando Gemini.
 */
export async function generateText(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: GENERATION_MODEL,
    generationConfig: {
      temperature: params.temperature ?? 0.4,
      maxOutputTokens: params.maxTokens ?? 4000,
      responseMimeType: "application/json",
    },
    systemInstruction: params.systemPrompt,
  });

  const result = await model.generateContent(params.userPrompt);
  return result.response.text();
}

/**
 * Gera embedding pra um texto via REST API direta.
 *
 * Por que não usar o método do SDK? O `@google/generative-ai` 0.24.x não
 * expõe `outputDimensionality` no tipo `EmbedContentRequest`, então não
 * conseguimos forçar 768 dims (e o default de gemini-embedding-001 é 3072,
 * o que estouraria a coluna VECTOR(768) do banco). Chamar a REST direto é
 * mais simples e sob controle total.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: text.replace(/\n/g, " ").trim() }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embedding API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { embedding: { values: number[] } };
  return data.embedding.values;
}

/**
 * Gera embeddings em batch (paralelo). Para volumes grandes, prefira
 * controlar o paralelismo no chamador pra respeitar rate limits.
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  return Promise.all(texts.map((t) => generateEmbedding(t)));
}
