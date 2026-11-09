-- One-time deployment grants. NOT applied automatically.
-- Requires security-reviewed, non-owner, non-superuser, NO BYPASSRLS
-- logins proxy_provisioning_runtime_login and proxy_credential_writer_login.
-- A different operational role must fetch decrypted tokens for authorized
-- diagnostics; neither the CRM nor browser receives any vault grants.
BEGIN;
REVOKE ALL ON proxy_control.whatsapp_provisioning,
 proxy_control.whatsapp_authorization_sessions,
 proxy_control.whatsapp_credential_envelopes,
 proxy_control.whatsapp_provisioning_events FROM PUBLIC;
GRANT USAGE ON SCHEMA proxy_control TO
 proxy_provisioning_runtime_login, proxy_credential_writer_login;
GRANT SELECT ON proxy_control.connection_requests
 TO proxy_provisioning_runtime_login;
GRANT SELECT,INSERT,UPDATE ON proxy_control.whatsapp_provisioning
 TO proxy_provisioning_runtime_login;
GRANT SELECT,INSERT,UPDATE ON proxy_control.whatsapp_authorization_sessions
 TO proxy_provisioning_runtime_login;
GRANT INSERT ON proxy_control.whatsapp_provisioning_events
 TO proxy_provisioning_runtime_login;

GRANT SELECT,UPDATE ON proxy_control.whatsapp_provisioning
 TO proxy_credential_writer_login;
GRANT SELECT,UPDATE ON proxy_control.whatsapp_authorization_sessions
 TO proxy_credential_writer_login;
GRANT INSERT ON proxy_control.whatsapp_credential_envelopes
 TO proxy_credential_writer_login;
GRANT INSERT ON proxy_control.whatsapp_provisioning_events
 TO proxy_credential_writer_login;
GRANT USAGE ON SEQUENCE proxy_control.whatsapp_provisioning_events_id_seq
 TO proxy_provisioning_runtime_login,proxy_credential_writer_login;
COMMIT;
