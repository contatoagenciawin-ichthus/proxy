-- G2 Proxy central receipt schema; STAGED, DO NOT APPLY AUTOMATICALLY.
-- Persist only authorized request metadata, never Meta credentials or messages.
create schema if not exists proxy_control;
create table proxy_control.connection_requests (
 id uuid primary key default gen_random_uuid(),
 product text not null check (product = 'proxy-relationship'),
 organization_id uuid not null,
 protocol_id uuid not null,
 channel text not null check(channel = 'whatsapp'),
 status text not null default 'received_by_proxy' check(status in ('received_by_proxy','awaiting_owner_authorization','validating','completed','cancelled','recoverable_failure')),
 version integer not null default 1 check(version > 0),
 received_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(product,organization_id,protocol_id),
 unique(product,protocol_id)
);
create index on proxy_control.connection_requests(status,received_at);
-- A separate, non-owner receiver login is mandatory before activation.
-- No grants to PUBLIC. Provision scoped privileges only after isolated
-- database tests and an explicit approval of the deployment.
revoke all on schema proxy_control from public;
revoke all on proxy_control.connection_requests from public;
