import { config } from "dotenv";
config({ path: ".env.local" });

import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import sensible from "@fastify/sensible";
import { authRoutes } from "./routes/auth";
import { studentRoutes } from "./routes/students";
import { trainingPlanRoutes } from "./routes/training-plans";
import { progressRoutes } from "./routes/progress";
import { knowledgeRoutes } from "./routes/knowledge";
import { getJwtSecret } from "./lib/jwt-secret";

const PORT = Number(process.env.SERVER_PORT) || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

async function buildServer() {
  // Falha antes de qualquer coisa se o segredo do JWT não estiver configurado
  const jwtSecret = getJwtSecret();

  const app = Fastify({
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    },
  });

  // ─── Plugins ───
  await app.register(cors, {
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(jwt, {
    // Use Supabase JWT secret for token verification (sem fallback)
    secret: jwtSecret,
    verify: { algorithms: ["HS256"] },
  });

  await app.register(sensible);

  // ─── Global error handler for Zod validation ───
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.name === "ZodError") {
      const zodError = error as any;
      return reply.status(400).send({
        error: "Dados inválidos",
        details: zodError.issues?.map((issue: any) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    app.log.error(error);
    return reply.status(error.statusCode || 500).send({
      error: error.message || "Erro interno do servidor.",
    });
  });

  // ─── Routes ───
  await app.register(authRoutes, { prefix: "/api" });
  await app.register(studentRoutes, { prefix: "/api" });
  await app.register(trainingPlanRoutes, { prefix: "/api" });
  await app.register(progressRoutes, { prefix: "/api" });
  await app.register(knowledgeRoutes, { prefix: "/api" });

  // ─── Health check ───
  app.get("/api/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  }));

  return app;
}

buildServer()
  .then((app) => {
    app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
      if (err) {
        app.log.error(err);
        process.exit(1);
      }
      app.log.info(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
