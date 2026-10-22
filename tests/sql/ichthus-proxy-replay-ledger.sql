-- Disposable PostgreSQL test only. Execute inside its own scratch database.
\set ON_ERROR_STOP on
\ir ../../db/staged/0001_ichthus_proxy_permit_replay_STAGED.sql

do $tests$
declare
  first_org uuid := '1715a7b9-5209-4e7c-8439-84658061904f';
  other_org uuid := '22222222-2222-4222-8222-222222222222';
  n integer;
begin
  insert into proxy_meta.ichthus_exchange_permit_uses
    (organization_id,permit_id,nonce_digest,consumed_at,expires_at)
  values (first_org, repeat('a',40),repeat('b',64),now(),now()+interval '60 seconds');
  insert into proxy_meta.ichthus_exchange_permit_uses
    (organization_id,permit_id,nonce_digest,consumed_at,expires_at)
  values (first_org,repeat('a',40),repeat('c',64),now(),now()+interval '60 seconds')
  on conflict do nothing;
  select count(*) into n from proxy_meta.ichthus_exchange_permit_uses;
  if n <> 1 then raise exception 'duplicate permit accepted'; end if;
  insert into proxy_meta.ichthus_exchange_permit_uses
    (organization_id,permit_id,nonce_digest,consumed_at,expires_at)
  values (first_org,repeat('d',40),repeat('b',64),now(),now()+interval '60 seconds')
  on conflict do nothing;
  select count(*) into n from proxy_meta.ichthus_exchange_permit_uses;
  if n <> 1 then raise exception 'different permit reused same OAuth nonce'; end if;
  insert into proxy_meta.ichthus_exchange_permit_uses
    (organization_id,permit_id,nonce_digest,consumed_at,expires_at)
  values (other_org,repeat('a',40),repeat('b',64),now(),now()+interval '60 seconds');
  select count(*) into n from proxy_meta.ichthus_exchange_permit_uses;
  if n <> 2 then raise exception 'independent tenant was not isolated'; end if;
  if not (select relrowsecurity and relforcerowsecurity
          from pg_class where oid='proxy_meta.ichthus_exchange_permit_uses'::regclass) then
    raise exception 'row level security not forced';
  end if;
end $tests$;

-- Even with a manually granted INSERT privilege, the unactivated policy
-- remains fail-closed. Both grants below are rolled back and never deploy.
begin;
create role proxy_replay_probe nologin nobypassrls nosuperuser;
grant usage on schema proxy_meta to proxy_replay_probe;
grant insert on proxy_meta.ichthus_exchange_permit_uses to proxy_replay_probe;
set local role proxy_replay_probe;
do $rls$
begin
  begin
    insert into proxy_meta.ichthus_exchange_permit_uses
      (organization_id,permit_id,nonce_digest,consumed_at,expires_at)
    values ('1715a7b9-5209-4e7c-8439-84658061904f',repeat('x',40),repeat('e',64),now(),now()+interval '60 seconds');
    raise exception 'unexpected INSERT allowed by RLS';
  exception
    when insufficient_privilege then null;
  end;
end $rls$;
reset role;
rollback;

-- Staged writer provisioning on this disposable test DB only.
\ir ../../db/staged/0002_ichthus_proxy_replay_writer_STAGED.sql
begin;
set local role proxy_meta_ichthus_replay_writer;
do $writer$
declare
  inserted_id text;
begin
  insert into proxy_meta.ichthus_exchange_permit_uses
    (organization_id,permit_id,nonce_digest,consumed_at,expires_at)
  values ('1715a7b9-5209-4e7c-8439-84658061904f',repeat('q',40),repeat('f',64),now(),now()+interval '60 seconds')
  on conflict do nothing returning permit_id into inserted_id;
  if inserted_id is null then raise exception 'authorized Ichthus writer could not insert'; end if;
  begin
    insert into proxy_meta.ichthus_exchange_permit_uses
      (organization_id,permit_id,nonce_digest,consumed_at,expires_at)
    values ('22222222-2222-4222-8222-222222222222',repeat('z',40),repeat('9',64),now(),now()+interval '60 seconds');
    raise exception 'cross-tenant writer unexpectedly inserted';
  exception when insufficient_privilege then null; end;
  begin
    delete from proxy_meta.ichthus_exchange_permit_uses
      where permit_id=repeat('q',40);
    raise exception 'writer unexpectedly deleted consumed ticket';
  exception when insufficient_privilege then null; end;
end $writer$;
reset role;
rollback;

select 'Proxy G2 replay ledger and writer RLS: disposable SQL tests passed' as result;
