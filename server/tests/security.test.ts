/**
 * Testes de segurança da API (sem banco real: o `db` do Drizzle é mockado).
 * Rodar com: npm run test:server
 */
import { test, describe, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import Fastify, { type FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import { getTableName, type Table } from "drizzle-orm";
import { db } from "../lib/db";
import { getJwtSecret } from "../lib/jwt-secret";
import { progressRoutes } from "../routes/progress";

const SECRET = "test-secret-with-at-least-32-characters!!";
const ANON_KEY = "public-anon-key-that-everyone-can-read-xyz";

describe("getJwtSecret", () => {
  test("falha sem SUPABASE_JWT_SECRET (sem fallback para a anon key)", () => {
    assert.throws(
      () => getJwtSecret({ NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON_KEY }),
      /SUPABASE_JWT_SECRET não definido/
    );
    assert.throws(() => getJwtSecret({ SUPABASE_JWT_SECRET: "   " }));
  });

  test("recusa segredo igual à anon key", () => {
    assert.throws(
      () =>
        getJwtSecret({
          SUPABASE_JWT_SECRET: ANON_KEY,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON_KEY,
        }),
      /anon key/
    );
  });

  test("recusa segredo curto", () => {
    assert.throws(() => getJwtSecret({ SUPABASE_JWT_SECRET: "curto" }), /curto/);
  });

  test("retorna o segredo configurado", () => {
    assert.equal(
      getJwtSecret({
        SUPABASE_JWT_SECRET: SECRET,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON_KEY,
      }),
      SECRET
    );
  });
});

// ─── IDOR em /students/:studentId/{sessions,progress,progress/summary} ───

const PROFESSIONAL_ID = "11111111-1111-1111-1111-111111111111";
const OWN_STUDENT = "22222222-2222-2222-2222-222222222222";
const OTHER_STUDENT = "33333333-3333-3333-3333-333333333333";

let queriedTables: string[] = [];
let ownedStudents: Set<string>;

/** Cadeia falsa do Drizzle: select().from(t).where().orderBy().limit() */
function fakeSelect() {
  let table = "";
  const chain: any = {
    from(t: Table) {
      table = getTableName(t);
      queriedTables.push(table);
      return chain;
    },
    where(cond: unknown) {
      chain._cond = cond;
      return chain;
    },
    orderBy: () => chain,
    limit: () => chain,
    then(resolve: (rows: unknown[]) => unknown, reject: (e: unknown) => unknown) {
      return Promise.resolve(rowsFor(table, chain._cond)).then(resolve, reject);
    },
  };
  return chain;
}

function rowsFor(table: string, cond: unknown): unknown[] {
  if (table === "professionals") return [{ id: PROFESSIONAL_ID }];
  if (table === "students") {
    // A condição where carrega os parâmetros (studentId, professionalId)
    const params = JSON.stringify(cond, (_k, v) =>
      typeof v === "object" && v !== null && "table" in v && "name" in v ? undefined : v
    );
    const owned = [...ownedStudents].some(
      (id) => params.includes(id) && params.includes(PROFESSIONAL_ID)
    );
    return owned ? [{ id: OWN_STUDENT }] : [];
  }
  if (table === "training_sessions") return [{ id: "s1", perceivedEffort: 12, count: 1 }];
  return [{ id: "r1", metricType: "peso" }];
}

describe("progress routes — ownership", () => {
  let app: FastifyInstance;
  let token: string;

  beforeEach(async () => {
    queriedTables = [];
    ownedStudents = new Set([OWN_STUDENT]);
    mock.method(db, "select", fakeSelect);

    app = Fastify();
    await app.register(jwt, { secret: SECRET, verify: { algorithms: ["HS256"] } });
    await app.register(progressRoutes, { prefix: "/api" });
    await app.ready();
    token = app.jwt.sign({ sub: "auth-user-1", email: "a@b.c", role: "authenticated" });
  });

  afterEach(async () => {
    mock.restoreAll();
    await app.close();
  });

  const paths = ["sessions", "progress", "progress/summary"];

  for (const path of paths) {
    test(`GET /students/:id/${path} de outro profissional → 404 sem ler dados`, async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/students/${OTHER_STUDENT}/${path}`,
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(res.statusCode, 404);
      assert.deepEqual(
        queriedTables.filter((t) => !["professionals", "students"].includes(t)),
        []
      );
    });

    test(`GET /students/:id/${path} do próprio profissional → 200`, async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/students/${OWN_STUDENT}/${path}`,
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(res.statusCode, 200);
      assert.ok(queriedTables.includes("students"));
    });
  }

  test("token assinado com a anon key é recusado (401)", async () => {
    const forger = Fastify();
    await forger.register(jwt, { secret: ANON_KEY });
    await forger.ready();
    const forged = forger.jwt.sign({ sub: "auth-user-1" });
    await forger.close();

    const res = await app.inject({
      method: "GET",
      url: `/api/students/${OWN_STUDENT}/sessions`,
      headers: { authorization: `Bearer ${forged}` },
    });
    assert.equal(res.statusCode, 401);
  });
});
