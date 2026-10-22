/**
 * Resolve o segredo HS256 usado para validar os JWTs do Supabase.
 *
 * Não existe fallback: sem SUPABASE_JWT_SECRET o servidor não sobe.
 * (Antes o fallback era a anon key, que é pública e permitia forjar tokens.)
 */
export function getJwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.SUPABASE_JWT_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "SUPABASE_JWT_SECRET não definido. Defina o JWT secret do projeto Supabase antes de subir a API."
    );
  }

  if (secret === env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    throw new Error(
      "SUPABASE_JWT_SECRET não pode ser igual à anon key (que é pública)."
    );
  }

  if (secret.length < 32) {
    throw new Error("SUPABASE_JWT_SECRET muito curto (mínimo de 32 caracteres).");
  }

  return secret;
}
