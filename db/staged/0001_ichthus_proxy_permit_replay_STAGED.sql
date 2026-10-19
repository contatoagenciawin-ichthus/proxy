-- G2 STAGED ONLY. Do not apply to an existing/shared/production database without
-- explicit authorization and a dedicated, least-privileged central Proxy DB role.
-- This table belongs to Proxy Technology, NOT a tenant CRM database.
create schema if not exists proxy_meta;
create table proxy_meta.ichthus_exchange_permit_uses (
  organization_id uuid not null,
  permit_id text not null check (permit_id ~ '^[A-Za-z0-9_-]{32,128}$'),
  nonce_digest char(64) not null check (nonce_digest ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  consumed_at timestamptz not null,
  primary key (organization_id,permit_id),
  unique (organization_id,nonce_digest),
  check (expires_at > consumed_at)
);
create index ichthus_exchange_permit_uses_expiry_idx
  on proxy_meta.ichthus_exchange_permit_uses (expires_at);
-- Provision the dedicated role through a separately approved change.
-- Do not inherit broad production application grants. Always revoke default ACLs
-- and verify the role can only INSERT/SELECT the bounded replay table.
revoke all privileges on proxy_meta.ichthus_exchange_permit_uses from public;
alter table proxy_meta.ichthus_exchange_permit_uses enable row level security;
alter table proxy_meta.ichthus_exchange_permit_uses force row level security;
-- Actual tenant and role-scoped policy must be reviewed with the chosen Proxy
-- storage project and added before granting runtime access.
-- No runtime grants are included, keeping this migration non-operational.
