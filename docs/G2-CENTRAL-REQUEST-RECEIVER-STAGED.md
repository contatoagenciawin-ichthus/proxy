# G2 central Proxy — staged receiver contract (2026-10-25)

## Scope
This branch adds **only** a central request-verification module, unit tests and a staged Postgres receipt table. The administrative dashboard remains an evidence inventory, not a live queue. No Meta API, WABA, callbacks, tokens, WhatsApp messages or existing clients are touched.

The CRM request is created under the CRM's authorized owner/admin session with one unique active protocol and a transactional outbox. The Proxy will acknowledge **only after** a durable receipt is committed in a separate central database. Signing is HMAC-SHA256 over a canonical tuple and timestamp, with a five-minute validity window. Every supported CRM organization must be explicitly approved for its product. The public request contains only `product, organizationId, protocolId, channel, status, version`. The server-to-server secret is never exposed to a browser.

## Important blockers
- No central Postgres database connection or scoped service login has yet been provisioned.
- This module uses an injected `saveReceipt` contract; the actual adapter and HTTPS endpoint are **not** wired.
- The new SQL is staged only; no schema changes have been applied.
- Signature freshness alone cannot prevent replay. The receipt store **must** atomically enforce unique `(product,organization_id,protocol_id)`, return the existing receipt on duplicates, and never acknowledge before commit.
- Implement receiver API with request size limit, timestamp/hex header parsing, IP-independent authentication, explicit feature flag, server-only secret and request allowlist; use a receiver-specific role without access to Meta credentials.
- Implement CRM outbox leasing/retry with acknowledgement/ETag consistency, and tests for unavailable Proxy, duplicate deliveries, two tenants, rollback and server authorization.
- Only after Postgres disposable integration tests, preview CI, and operator acceptance, enable receiver/worker on test infrastructure. Production requires a separate decision.

## Protection
Existing `/meta/admin` remains GitHub-authenticated and read-only. Central ingestion has separate service-to-service authorization and no public administrative access. No automatic AI activation or callback changes.

## CI
Meta-admin workflow runs on draft PR and tests `tests/meta-admin*.test.mjs`, typechecks, builds and runs smoke suite. Status must be checked at final commit before approval.
