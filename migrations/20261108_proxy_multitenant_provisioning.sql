-- PROPOSED MIGRATION ONLY. Apply after staging RLS / security review.
-- No client-specific environment variables, no callback mutation, no token plaintext.
-- Access grants are intentionally NOT part of this migration: dedicated runtime roles
-- must be created and approved separately. Database owner has no BYPASSRLS.
BEGIN;

CREATE TABLE IF NOT EXISTS proxy_control.whatsapp_provisioning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES proxy_control.connection_requests(id),
  organization_id uuid NOT NULL,
  protocol_id uuid NOT NULL,
  product text NOT NULL,
  waba_id text,
  phone_number_id text,
  meta_app_id text,
  business_id text,
  phase text NOT NULL DEFAULT 'requested',
  operator_id text,
  meta_consent_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product,organization_id,protocol_id),
  CHECK (phase IN ('requested','operator_assigned','awaiting_authorization','authorization_received','credential_secured','diagnosing','ready_for_validation','active','blocked','revoked')),
  CHECK (waba_id IS NULL OR waba_id ~ '^[0-9]{5,24}$'),
  CHECK (phone_number_id IS NULL OR phone_number_id ~ '^[0-9]{5,24}$'),
  CHECK (meta_app_id IS NULL OR meta_app_id ~ '^[0-9]{5,24}$'),
  CHECK (business_id IS NULL OR business_id ~ '^[0-9]{5,24}$')
);

CREATE TABLE IF NOT EXISTS proxy_control.whatsapp_credential_envelopes (
  provisioning_id uuid PRIMARY KEY REFERENCES proxy_control.whatsapp_provisioning(id) ON DELETE RESTRICT,
  organization_id uuid NOT NULL,
  envelope_version integer NOT NULL CHECK (envelope_version=1),
  key_version integer NOT NULL CHECK (key_version>=1),
  iv text NOT NULL,
  ciphertext text NOT NULL,
  tag text NOT NULL,
  fingerprint char(16) NOT NULL CHECK (fingerprint ~ '^[a-f0-9]{16}$'),
  authorized_scopes text[] NOT NULL DEFAULT '{}'::text[],
  expires_at timestamptz,
  sealed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proxy_control.whatsapp_provisioning_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provisioning_id uuid NOT NULL REFERENCES proxy_control.whatsapp_provisioning(id) ON DELETE RESTRICT,
  organization_id uuid NOT NULL,
  event_type text NOT NULL CHECK (length(event_type) BETWEEN 3 AND 80),
  operator_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(details)='object')
);

CREATE INDEX IF NOT EXISTS whatsapp_provisioning_org_phase_idx
 ON proxy_control.whatsapp_provisioning(organization_id,phase);
CREATE INDEX IF NOT EXISTS whatsapp_provisioning_events_org_recorded_idx
 ON proxy_control.whatsapp_provisioning_events(organization_id,recorded_at DESC);

ALTER TABLE proxy_control.whatsapp_provisioning ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_control.whatsapp_provisioning FORCE ROW LEVEL SECURITY;
ALTER TABLE proxy_control.whatsapp_credential_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_control.whatsapp_credential_envelopes FORCE ROW LEVEL SECURITY;
ALTER TABLE proxy_control.whatsapp_provisioning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_control.whatsapp_provisioning_events FORCE ROW LEVEL SECURITY;

-- Intentional separation: one dedicated role may read status; a distinct,
-- audited credential-writer role will receive explicit UPDATE/INSERT only on
-- the envelope store. NO browser or CRM role receives credential read grants.
CREATE POLICY provisioning_tenant_scope ON proxy_control.whatsapp_provisioning
 FOR ALL USING (organization_id = nullif(current_setting('app.organization_id',true),'')::uuid)
 WITH CHECK (organization_id = nullif(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY envelopes_tenant_scope ON proxy_control.whatsapp_credential_envelopes
 FOR ALL USING (organization_id = nullif(current_setting('app.organization_id',true),'')::uuid)
 WITH CHECK (organization_id = nullif(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY events_tenant_scope ON proxy_control.whatsapp_provisioning_events
 FOR ALL USING (organization_id = nullif(current_setting('app.organization_id',true),'')::uuid)
 WITH CHECK (organization_id = nullif(current_setting('app.organization_id',true),'')::uuid);

COMMIT;
