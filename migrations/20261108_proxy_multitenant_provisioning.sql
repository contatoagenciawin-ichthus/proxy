-- Staging-only proposed migration. No production deployment or credentials.
BEGIN;
CREATE TABLE proxy_control.whatsapp_provisioning (
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
 UNIQUE(product,organization_id,protocol_id),
 UNIQUE(id,organization_id),
 CHECK(phase IN ('requested','operator_assigned','awaiting_authorization','authorization_received','credential_secured','diagnosing','ready_for_validation','active','blocked','revoked'))
);
CREATE TABLE proxy_control.whatsapp_credential_envelopes (
 provisioning_id uuid PRIMARY KEY,
 organization_id uuid NOT NULL,
 envelope_version integer NOT NULL CHECK(envelope_version=1),
 key_version integer NOT NULL CHECK(key_version>0),
 iv text NOT NULL,
 ciphertext text NOT NULL,
 tag text NOT NULL,
 fingerprint char(16) NOT NULL,
 authorized_scopes text[] NOT NULL DEFAULT '{}'::text[],
 expires_at timestamptz,
 sealed_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tenant_envelope_fk FOREIGN KEY(provisioning_id,organization_id)
 REFERENCES proxy_control.whatsapp_provisioning(id,organization_id)
);
CREATE TABLE proxy_control.whatsapp_provisioning_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 provisioning_id uuid NOT NULL,
 organization_id uuid NOT NULL,
 event_type text NOT NULL,
 operator_id text,
 details jsonb NOT NULL DEFAULT '{}'::jsonb,
 recorded_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tenant_event_fk FOREIGN KEY(provisioning_id,organization_id)
 REFERENCES proxy_control.whatsapp_provisioning(id,organization_id),
 CHECK(jsonb_typeof(details)='object')
);
CREATE TABLE proxy_control.whatsapp_authorization_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provisioning_id uuid NOT NULL,
 organization_id uuid NOT NULL,
 operator_id text NOT NULL,
 nonce_digest char(64) NOT NULL,
 expected_waba_id text,
 expected_phone_number_id text,
 expected_app_id text NOT NULL,
 issued_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 CONSTRAINT tenant_authorization_fk FOREIGN KEY(provisioning_id,organization_id)
 REFERENCES proxy_control.whatsapp_provisioning(id,organization_id),
 UNIQUE(organization_id,nonce_digest),
 CHECK(expires_at>issued_at)
);
CREATE INDEX provisioning_org_phase_idx
 ON proxy_control.whatsapp_provisioning(organization_id,phase);
CREATE INDEX provisioning_events_org_recorded_idx
 ON proxy_control.whatsapp_provisioning_events(organization_id,recorded_at DESC);
CREATE INDEX authorization_sessions_active_idx
 ON proxy_control.whatsapp_authorization_sessions(provisioning_id,expires_at)
 WHERE consumed_at IS NULL;
ALTER TABLE proxy_control.whatsapp_provisioning ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_control.whatsapp_provisioning FORCE ROW LEVEL SECURITY;
ALTER TABLE proxy_control.whatsapp_credential_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_control.whatsapp_credential_envelopes FORCE ROW LEVEL SECURITY;
ALTER TABLE proxy_control.whatsapp_provisioning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_control.whatsapp_provisioning_events FORCE ROW LEVEL SECURITY;
ALTER TABLE proxy_control.whatsapp_authorization_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_control.whatsapp_authorization_sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY provisioning_tenant_scope ON proxy_control.whatsapp_provisioning
 FOR ALL USING (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid)
 WITH CHECK (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY envelopes_tenant_scope ON proxy_control.whatsapp_credential_envelopes
 FOR ALL USING (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid)
 WITH CHECK (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY events_tenant_scope ON proxy_control.whatsapp_provisioning_events
 FOR ALL USING (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid)
 WITH CHECK (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY authorization_tenant_scope ON proxy_control.whatsapp_authorization_sessions
 FOR ALL USING (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid)
 WITH CHECK (organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);
COMMIT;
