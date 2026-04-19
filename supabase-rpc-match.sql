-- ══════════════════════════════════════════════════════════
-- FisioMentor — Função RPC para busca vetorial
-- Cole no SQL Editor do Supabase e execute
-- ══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 8,
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_name TEXT,
  category VARCHAR(30),
  content_chunk TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.source_name,
    kb.category,
    kb.content_chunk,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE
    (filter_category IS NULL OR kb.category = filter_category)
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
