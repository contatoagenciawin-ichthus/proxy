-- Daily Meta connection metadata checkpoint. Never stores tokens or message bodies.
CREATE TABLE proxy_control.whatsapp_connection_daily_checks (
  organization_id uuid NOT NULL,
  phone_number_id text NOT NULL CHECK (phone_number_id ~ '^[0-9]{5,24}$'),
  checked_at timestamptz NOT NULL DEFAULT now(),
  result text NOT NULL CHECK (result IN ('confirmed','attention','inconclusive')),
  waba_status text NOT NULL CHECK (waba_status IN ('verified','no_access','not_found','inconclusive','error','blocked')),
  phone_status text NOT NULL CHECK (phone_status IN ('verified','no_access','not_found','inconclusive','error','blocked')),
  subscription_status text NOT NULL CHECK (subscription_status IN ('verified','no_access','not_found','inconclusive','error','blocked')),
  callback_status text NOT NULL CHECK (callback_status IN ('verified','no_access','not_found','inconclusive','error','blocked')),
  PRIMARY KEY(organization_id,phone_number_id)
);
ALTER TABLE proxy_control.whatsapp_connection_daily_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_control.whatsapp_connection_daily_checks FORCE ROW LEVEL SECURITY;
CREATE POLICY daily_checks_tenant_scope ON proxy_control.whatsapp_connection_daily_checks
 USING (organization_id = NULLIF(current_setting('app.organization_id',true),'')::uuid)
 WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id',true),'')::uuid);
REVOKE ALL ON proxy_control.whatsapp_connection_daily_checks FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON proxy_control.whatsapp_connection_daily_checks TO proxy_provisioning_runtime_login;
GRANT SELECT ON proxy_control.whatsapp_connection_daily_checks TO proxy_connection_admin_reader_login;
