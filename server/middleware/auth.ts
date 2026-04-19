import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../lib/db";
import { professionals } from "../../src/lib/db/schema";
import { eq } from "drizzle-orm";

declare module "fastify" {
  interface FastifyRequest {
    professionalId: string;
    authUserId: string;
  }
}

/**
 * Middleware de autenticação que extrai o professional_id do JWT Supabase.
 * O token deve ser enviado no header Authorization: Bearer <token>
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verify JWT (Supabase token)
    const decoded = await request.jwtVerify<{
      sub: string;
      email: string;
      role: string;
    }>();

    const authUserId = decoded.sub;

    // Find the professional linked to this auth user
    const [professional] = await db
      .select({ id: professionals.id })
      .from(professionals)
      .where(eq(professionals.authUserId, authUserId))
      .limit(1);

    if (!professional) {
      return reply.status(403).send({
        error: "Perfil profissional não encontrado. Complete seu cadastro.",
      });
    }

    request.authUserId = authUserId;
    request.professionalId = professional.id;
  } catch (err) {
    return reply.status(401).send({
      error: "Token de autenticação inválido ou expirado.",
    });
  }
}
