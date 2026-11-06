-- STAGED ONLY. Apply only to an isolated Neon branch after permission tests.
-- A request receipt is immutable evidence of delivery; operator workflow is separate.
-- Never grant mutations to proxy_connection_receiver_restricted.
create table proxy_control.connection_request_workflow (
 product text not null default 'proxy-relationship' check (product='proxy-relationship'),
 organization_id uuid not null,
 protocol_id uuid not null,
 stage text not null default 'received' check (stage in
   ('received','under_review','awaiting_customer','authorization_pending',
    'technical_validation','operational_validation','active','suspended','cancelled')),
 assigned_operator_id text,
 next_action text,
 updated_at timestamptz not null default now(),
 version integer not null default 1 check (version>=1),
 primary key(product,organization_id,protocol_id),
 foreign key(product,organization_id,protocol_id)
   references proxy_control.connection_requests(product,organization_id,protocol_id)
);
create table proxy_control.connection_request_workflow_events (
 id uuid primary key default gen_random_uuid(),
 product text not null default 'proxy-relationship' check(product='proxy-relationship'),
 organization_id uuid not null,
 protocol_id uuid not null,
 actor_id text not null,
 action text not null check(action in ('assign','stage_change','note','next_action')),
 from_stage text,
 to_stage text,
 note text,
 recorded_at timestamptz not null default now(),
 foreign key(product,organization_id,protocol_id)
   references proxy_control.connection_requests(product,organization_id,protocol_id),
 check (note is null or char_length(note)<=1000)
);
create index on proxy_control.connection_request_workflow_events
 (organization_id,protocol_id,recorded_at desc);
alter table proxy_control.connection_request_workflow enable row level security;
alter table proxy_control.connection_request_workflow force row level security;
alter table proxy_control.connection_request_workflow_events enable row level security;
alter table proxy_control.connection_request_workflow_events force row level security;
create policy workflow_tenant on proxy_control.connection_request_workflow
 using (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid)
 with check (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);
create policy workflow_events_tenant on proxy_control.connection_request_workflow_events
 using (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid)
 with check (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);
revoke all on proxy_control.connection_request_workflow,proxy_control.connection_request_workflow_events from public;
-- Distinct NOLOGIN role; do not grant to receiver, CRM or current provider login.
create role proxy_connection_workflow_operator nologin nobypassrls nocreaterole;
grant usage on schema proxy_control to proxy_connection_workflow_operator;
grant select on proxy_control.connection_requests to proxy_connection_workflow_operator;
grant select,insert,update(stage,assigned_operator_id,next_action,updated_at,version)
 on proxy_control.connection_request_workflow to proxy_connection_workflow_operator;
grant select,insert on proxy_control.connection_request_workflow_events
 to proxy_connection_workflow_operator;
-- Do NOT provision operator login or apply this migration outside an isolated test.
