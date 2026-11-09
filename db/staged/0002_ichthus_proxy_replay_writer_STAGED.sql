-- G2 STAGED ONLY. This file is NOT a migration approval.
-- Apply only after deciding where the dedicated Proxy replay ledger is hosted.
-- Requires 0001_ichthus_proxy_permit_replay_STAGED.sql on an isolated database.
-- Role has NO LOGIN, NO BYPASSRLS, no broad DB permissions, and never reads tokens.
create role proxy_meta_ichthus_replay_writer
  nologin nobypassrls nosuperuser nocreatedb nocreaterole noreplication;
grant usage on schema proxy_meta to proxy_meta_ichthus_replay_writer;
create policy ichthus_replay_insert on proxy_meta.ichthus_exchange_permit_uses
  for insert to proxy_meta_ichthus_replay_writer
  with check (organization_id = '1715a7b9-5209-4e7c-8439-84658061904f'::uuid);
create policy ichthus_replay_select on proxy_meta.ichthus_exchange_permit_uses
  for select to proxy_meta_ichthus_replay_writer
  using (organization_id = '1715a7b9-5209-4e7c-8439-84658061904f'::uuid);
-- Needed for INSERT ... RETURNING permit_id only; no UPDATE/DELETE.
grant insert (organization_id,permit_id,nonce_digest,expires_at,consumed_at)
  on proxy_meta.ichthus_exchange_permit_uses to proxy_meta_ichthus_replay_writer;
grant select (permit_id) on proxy_meta.ichthus_exchange_permit_uses
  to proxy_meta_ichthus_replay_writer;
-- Role login, credential issuance, network attachment and secrets remain
-- separately gated. Never grant this role to the legacy Eduardo runtime.
