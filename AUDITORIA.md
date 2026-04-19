# Auditoria do FisioMentor v1

> Diagnóstico completo do que funcionou, do que quebrou, e do que precisa morrer antes da v2 nascer.

---

## 1. O que o produto é (e por que faz sentido)

**FisioMentor** é um SaaS B2B para **profissionais de Educação Física com CREF** que prescrevem treino para **populações especiais** — cardiopatas, diabéticos, hipertensos, idosos, gestantes, pacientes pós-AVC, pessoas com lesões ortopédicas, etc. O diferencial não é "IA que gera treino"; já existe uma dezena disso. O diferencial real é **IA ancorada em diretrizes clínicas auditáveis** (ACSM, AHA, ADA, OMS, ESC, artigos peer-reviewed) com **validação clínica antes da entrega**, para que o profissional entregue um plano seguro mesmo em casos com contraindicações.

A pasta `artigos jonas/` tem cerca de **50 PDFs** de guidelines reais e estudos científicos. Essa é **a joia da coroa do produto** — e na v1 ela está sendo quase toda ignorada. O RAG usa 24 chunks montados à mão em `knowledge-chunks.ts` e o script `ingest-pdfs.ts` nunca foi executado de verdade. Qualquer rebuild precisa tratar essa biblioteca como ativo principal, não como anexo.

## 2. O que existe hoje (escopo atual)

**Web (Next.js 14)** — cadastro, login, onboarding de 4 passos, dashboard com KPIs, CRUD de alunos, anamnese em 5 passos com rascunho em localStorage, avaliações físicas, geração de plano com IA (loader de 120s), revisão do plano com validação clínica em 3 cores, registro de sessão com RPE, histórico, evolução, exportação em PDF, configurações.

**Mobile (Expo/React Native)** — paridade parcial: login, dashboard simplificado, perfil do aluno, geração de treino (como state machine, não form), visualização do plano (SectionList, diferente do web), relatórios, configurações.

**Backend** — **dois backends rodando em paralelo**: Next.js Route Handlers em `/api/*` e Fastify em `server/` na porta 3001. Web fala com Next API. Mobile fala com Fastify. Ambos gravam no mesmo Postgres. Os endpoints se sobrepõem parcialmente, a autenticação é feita de formas diferentes, e não há contrato único.

**IA** — Gemini via `@google/generative-ai`, embeddings `gemini-embedding-001` com 768 dims, pgvector no Supabase, validação clínica por **regex hardcoded** em `clinical-validator.ts` (14 regras).

## 3. Por que a v1 travou — diagnóstico técnico

**(a) Dualidade de backend é a causa raiz.** Ter Next.js API + Fastify é o pecado original. O usuário loga no Supabase; o Next valida a sessão via SSR cookie; o Fastify valida o mesmo token via `@fastify/jwt` com `SUPABASE_JWT_SECRET`. Quando o Supabase roda refresh, os dois ficam fora de sincronia. Há endpoints duplicados (`list students` no Fastify, `create student` no Next) sem contrato compartilhado. Metade da lógica de negócio está em `server/lib/` (validação clínica, geração de plano, RAG) e só o Next chama `generateTrainingPlan` — então se o mobile acionasse o Fastify pra gerar plano, ele pularia o pipeline inteiro.

**(b) O pipeline de IA é frágil em 4 pontos críticos:**

1. `JSON.parse(responseText)` em `training-generator.ts` sem try/catch. Qualquer resposta malformada do Gemini derruba a rota em 500.
2. A busca RAG no pgvector não tem timeout nem retry. Uma query lenta trava a request por minutos até o AbortController de 120s matar — o usuário vê "Validando…" pra sempre.
3. Validação clínica por regex (`/cardio|insufici/i.test(d)`) quebra com qualquer variação de escrita do diagnóstico. "Insuficiência cardíaca" passa; "IC classe II" não. Isso é **regra de segurança clínica sendo contornada por typo**.
4. Sem circuit breaker, sem retry com backoff, sem fallback. Rate limit do Gemini = outage total.

**(c) RAG é uma farsa educada.** Os 50 PDFs da pasta `artigos jonas/` não foram ingeridos — só os 24 chunks manuais entram no índice. Isso significa que o "contexto clínico" que alimenta o prompt é 90% mais pobre do que poderia ser. E como a validação pós-geração também é hardcoded, toda a promessa "baseado em evidências" não se sustenta no código.

**(d) Schema drift.** `drizzle/` tem migrations automáticas E `supabase-setup.sql` tem criação manual das mesmas tabelas. Se um dev rodou Drizzle push e outro rodou o SQL manual em outro ambiente, divergem silenciosamente. Colunas `monitoringNotes` (camelCase Drizzle) vs `monitoring_notes` (snake_case SQL) são um exemplo clássico de onde isso vira bug de produção.

**(e) Duplicação web/mobile sem strategy.** A mesma feature (gerar plano) tem duas UX diferentes: no web é form + POST + loader; no mobile é state machine de 5 estados. Manter paridade manualmente é inviável pra um time pequeno. E não existe nem camada de serviço compartilhada, nem SDK gerado do backend, nem tRPC.

**(f) Credenciais em claro no `.env.local`** que foi commitado. Service role key do Supabase e DATABASE_URL em plaintext.

## 4. Por que a v1 travou — diagnóstico de UX

**(a) Onboarding obrigatório em 4 passos** antes de ver qualquer valor. Usuário experiente que já tem carteira de alunos é forçado a cadastrar "primeiro aluno" antes de chegar ao dashboard.

**(b) Cadastro de aluno em 5 abas longas.** Só é razoável porque salva rascunho em localStorage — mas localStorage é por navegador, não por conta. Se o profissional começar no desktop e voltar no tablet, perde tudo. E no mobile, a paridade desse fluxo é incerta (o mapa de rotas mostra `aluno/novo` mas não o mesmo nível de detalhe).

**(c) Geração de plano sem feedback real.** 120 segundos de loader com 4 mensagens que rodam em loop, sem barra de progresso de verdade, sem streaming. Quando dá timeout, o erro é genérico. Quando o Gemini retorna algo bizarro, o usuário só vê "Serviço indisponível".

**(d) Validação clínica é decorativa.** As cores aparecem, mas nada impede o profissional de publicar um plano com contraindicação marcada em vermelho. Não há fluxo "substituir exercício automaticamente" nem "assinar ciente do risco". É um disclaimer bonito, não um guardrail.

**(e) Preferências de IA invisíveis.** "Sintético vs Detalhado" fica escondido em Configurações. O usuário não entende a diferença (não há exemplo), não sabe que isso afeta o output, e não consegue alterar no meio da geração.

**(f) Export só em JSON/PDF.** O profissional precisa mandar o plano pro aluno — o formato natural é PDF (existe) e WhatsApp/imagem (não existe). JSON raw não serve pra ninguém.

## 5. O que vale preservar da v1

Mesmo com tudo errado, há coisas maduras que não precisam ser reinventadas: **a modelagem de domínio** (profissional → aluno → perfil de saúde → preferências → avaliações → plano → sessão → progresso está correta), **a ideia de validação clínica em 3 níveis** (vermelho/amarelo/verde é bom UX, só precisa ser enforceable), **o onboarding com wizard** (só precisa ficar opcional e mais curto), **a biblioteca de PDFs** (ativo principal — precisa ser ingerida de verdade), e **o copy/tom do produto** ("populações especiais", "segurança clínica", "evidência científica" — identidade sólida).

## 6. Recomendação de stack para v2 (justificada)

O pedido foi "stack totalmente diferente". A resposta não é trocar React por Vue por gosto — é **eliminar a dualidade de backend e a duplicação web/mobile**, manter o que o Postgres + pgvector oferecem, e usar frameworks que reduzam código em vez de adicionar.

**Stack recomendada para v2:**

- **SvelteKit 2 (Svelte 5)** como fullstack único. Form actions nativas eliminam a necessidade de camada REST separada. Server load functions dão SSR com tipagem automática. Menos código, menos abstrações, menos bugs. Substitui Next.js + Fastify por um único processo.
- **Supabase** (manter) — Postgres, Auth, Storage, pgvector. A dor do Supabase Auth SSR era do Next, no SvelteKit é bem resolvido via hooks.
- **Drizzle ORM** (manter) — mas com **uma única fonte de verdade**: o schema Drizzle. Apaga o SQL manual. Migrations via `drizzle-kit push`.
- **Vercel AI SDK** — substitui o client Gemini hand-rolled. Dá streaming nativo, structured outputs com Zod, retry automático, provider-agnostic (Gemini hoje, Claude/OpenAI amanhã sem reescrever).
- **shadcn-svelte + TailwindCSS** — UI consistente, componentes copiados pro repo (sem dep mágica).
- **Zod** para validação em todas as camadas (form → server → DB → AI output).
- **PWA mobile-first** no próprio SvelteKit (com `@vite-pwa/sveltekit`). Elimina o Expo na v2. Quando precisar de app nativo de verdade, wrapper com **Capacitor** sobre o mesmo código. Um único codebase.
- **pgvector + LangChain-style chunking** pra ingerir os 50 PDFs de verdade. Script `pnpm rag:ingest-pdfs` que extrai, chunka, embeda e indexa de forma idempotente.
- **Inngest** ou **Trigger.dev** para rodar a geração de plano como **job em background**, com status persistido no banco. Adeus request de 120 segundos.
- **Playwright** para e2e dos fluxos críticos (gerar plano com contraindicação, publicar, registrar sessão).

**Alternativas se SvelteKit assustar:** Nuxt 3 (Vue, filosofia parecida) ou Remix/React Router v7 (permanece em React mas com data loading unificado). Evitar voltar pro Next.js — não porque ele seja ruim, mas porque o usuário já viveu a dor dele e pediu algo diferente.

## 7. Princípios não-negociáveis para a v2

Independente da stack escolhida, cinco linhas que a v2 não pode cruzar:

1. **Um backend, uma auth.** Nunca dois processos falando com o mesmo DB com tokens validados por secrets diferentes.
2. **Geração de plano é job em background, não request síncrono.** Status persistido, retomável, com retry automático. Front escuta via polling ou realtime.
3. **Validação clínica é guardrail, não decoração.** Contraindicação em vermelho bloqueia publicação até o profissional (a) substituir o exercício ou (b) registrar motivo por escrito da override.
4. **RAG ingere os PDFs de verdade, com versionamento.** Cada chunk carrega hash do arquivo fonte, página, e versão da diretriz. Quando sai ACSM 2026, regerar não perde auditoria dos planos antigos.
5. **Schema tem uma única fonte de verdade** (Drizzle). Nenhum SQL manual paralelo.

## 8. O que o super prompt precisa garantir

O `SUPER_PROMPT.md` acompanha esta auditoria e traduz os pontos acima em briefing executável pelo Claude. Ele cobre: contexto e missão, visão de produto, público-alvo, stack obrigatório, modelagem de dados, features completas, fluxos de UX passo a passo, pipeline de IA com guardrails, estratégia de RAG com ingestão de PDFs, critérios de aceitação, checklist de entrega e lista de anti-padrões (o que **não** fazer, referenciando os erros concretos da v1).
