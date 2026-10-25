# G2 central Proxy — staged receiver contract (2026-10-25)

## Scope
This branch adds **only** a central request-verification module, unit tests and a staged Postgres receipt table. The administrative dashboard remains an evidence inventory, not a live queue. No Meta API, WABA, callbacks, tokens, WhatsApp messages or existing clients are touched.

The CRM request is created under the CRM's authorized owner/admin session with one unique active protocol and a transactional outbox. The Proxy will acknowledge **only after** a durable receipt is committed in a separate central database. Signing is HMAC-SHA256 over a canonical tuple and timestamp, with a five-minute validity window. Every supported CRM organization must be explicitly approved for its product. The public request contains only `product, organizationId, protocolId, channel, status, version`. The server-to-server secret is never exposed to a browser.

## Important blockers
- No central Postgres database connection or scoped service login has yet been provisioned.
- A fail-closed HTTPS endpoint now exists at `/api/meta/admin/connection-requests`, with size limit, HMAC, timestamp and allowlist checks; it returns **503** unless a dedicated central database adapter is provisioned. The route intentionally passes no store today.
- The SQL transaction adapter is injectable and unit-tested, but **no live database connection, migration or worker is deployed**.
- The new SQL is staged only; no schema changes have been applied.
- Signature freshness alone cannot prevent replay. The receipt store **must** atomically enforce unique `(product,organization_id,protocol_id)`, return the existing receipt on duplicates, and never acknowledge before commit.
- Bind the HTTP route to a real durable store through a receiver-specific non-BYPASSRLS role after disposable database tests. The existing handler is disabled by default and does not accept requests operationally.
- Implement CRM outbox leasing/retry with acknowledgement/ETag consistency, and tests for unavailable Proxy, duplicate deliveries, two tenants, rollback and server authorization.
- Only after Postgres disposable integration tests, preview CI, and operator acceptance, enable receiver/worker on test infrastructure. Production requires a separate decision.

## Protection
Existing `/meta/admin` remains GitHub-authenticated and read-only. Central ingestion has separate service-to-service authorization and no public administrative access. No automatic AI activation or callback changes.

## CI
Meta-admin workflow runs on draft PR and tests `tests/meta-admin*.test.mjs`, typechecks, builds and runs smoke suite. Status must be checked at final commit before approval.

## Adendo de validação — 25/10
- Banco SQL central preparado com RLS FORCED e `proxy_connection_receiver` NOLOGIN, NOBYPASSRLS, privilégios somente SELECT/INSERT na tabela de recibos.
- `connection-receipt-store.mjs` agora configura `app.organization_id` local à transação após verificar a assinatura e a allowlist da origem.
- GitHub Actions inclui PostgreSQL 17 descartável, fixtures de organizações A/B, rejeição de escrita cruzada, idempotência e proibição de UPDATE pelo receptor. Workflow inicial com essa suíte: **success** (run 40242324328, commit 0bf896ada0e2daa78ef7fd223f21da00d2c202fb).
- Receiver HTTP foi endurecido para limitar bytes durante o streaming, mesmo sem Content-Length; nova revisão ainda exige check final.
- **Ainda não há banco central provisionado ou ligado à rota**. A rota segue retornando 503 sem `store`; nenhum pedido foi entregue de verdade à Proxy. As próximas tarefas são provisionamento aprovado de pool/login restrito, integração da instância transacional, confirmação sob sessão de teste e painel administrativo de pedidos.


## 25/10 — Restricted runtime and HTTP-to-storage tests
- `lib/meta-admin/connection-receiver-runtime.mjs`: binds an **injected** dedicated PostgreSQL pool to the receipt repository. It validates `is_superuser=off`, `rolbypassrls=false` and membership of `proxy_connection_receiver`; begins/commits or rolls back the transaction and releases the connection.
- `tests/meta-admin-connection-receiver-runtime.test.mjs`: validates minimum role and rollback behavior. Run 40242881270 was successful at commit `b8f61cb`.
- `tests/meta-admin-connection-request-chain.test.mjs`: synthetic HTTP -> HMAC -> restricted transaction -> idempotent receipt test, including denial of cross-tenant requests. This is an in-memory pool fixture, **not** a full real HTTP + Postgres integration.
- Real PostgreSQL 17 tests of the schema and RLS already passed in run 40242324328.
- **Unresolved:** runtime route intentionally provides no real `pool`/store, and no PostgreSQL client dependency or central database login has been provisioned. A dedicated driver, secure connection string, tested permissions and approved preview enablement are required before the endpoint may become operational.
- Operations to avoid without explicit approval: Neon project/branch changes, DB login provisioning, Vercel environment variables, deployment to production, `main` merge, Meta token/WhatsApp changes.
