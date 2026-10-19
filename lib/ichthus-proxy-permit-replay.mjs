// G2 STAGED: Proxy-side replay boundary for a CRM-signed exchange permit.
// The store must be durable, central to ALL Proxy instances, and atomic.
// No in-memory Set, best-effort cache, or per-instance locking is acceptable.
// No HTTP route, database credentials, Meta exchange or existing Eduardo flow.
import { verifyIchthusProxyExchangePermit } from "./ichthus-crm-exchange-permit.mjs";

export async function consumeIchthusProxyPermit({
  permit, secret, expectedOrganizationId, expectedConfigId,
  consumeOnce, now = Date.now(),
}) {
  const verified = verifyIchthusProxyExchangePermit({
    permit, secret, expectedOrganizationId, expectedConfigId, now,
  });
  if (typeof consumeOnce !== "function") throw new Error("proxy_permit_store_unavailable");
  // The adapter MUST atomically and durably commit consumption before returning true.
  // Replays and storage errors are fail-closed. Never roll back on Meta errors.
  let accepted = false;
  try {
    accepted = await consumeOnce({
      organizationId: verified.organizationId,
      permitId: verified.permitId,
      nonceDigest: verified.nonceDigest,
      expiresAt: new Date(now + 60_000),
      consumedAt: new Date(now),
    });
  } catch {
    throw new Error("proxy_permit_store_unavailable");
  }
  if (accepted !== true) throw new Error("proxy_permit_already_consumed");
  return Object.freeze({
    organizationId: verified.organizationId,
    wabaId: verified.wabaId,
    phoneNumberId: verified.phoneNumberId,
    configId: verified.configId,
    nonceDigest: verified.nonceDigest,
  });
}

// PostgreSQL adapter contract: an INSERT protected by unique (organization_id,permit_id).
// Query is deliberately injected; no Proxy DB connection or new dependency is assumed.
// A caller MUST supply a transactional query which commits before consumeOnce resolves;
// a transaction that is later rolled back DOES NOT provide replay prevention.
export async function consumeProxyPermitPostgresCommitted({
  organizationId, permitId, nonceDigest, expiresAt, consumedAt,
  insertAndCommit,
}) {
  if (typeof insertAndCommit !== "function") throw new Error("proxy_permit_store_unavailable");
  const result = await insertAndCommit({
    sql: `insert into proxy_meta.ichthus_exchange_permit_uses
          (organization_id, permit_id, nonce_digest, expires_at, consumed_at)
          values ($1,$2,$3,$4,$5)
          on conflict (organization_id, permit_id) do nothing
          returning permit_id`,
    params: [organizationId, permitId, nonceDigest, expiresAt, consumedAt],
  });
  return result?.rowCount === 1;
}
