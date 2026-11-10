-- REVIEW ONLY: do not apply without verifying the exact Proxy control-plane DB and branch.
-- Provision a separate login credential out of band; never reuse writer/runtime logins.
-- Login has no password until explicitly provisioned by an authorized operator.
BEGIN;
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='proxy_credential_reader_login') THEN
  CREATE ROLE proxy_credential_reader_login LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD NULL;
 END IF;
END $$;
DO $$
DECLARE r record;
BEGIN
 SELECT rolcanlogin,rolsuper,rolbypassrls,rolcreaterole,rolcreatedb,rolreplication
 INTO r FROM pg_roles WHERE rolname='proxy_credential_reader_login';
 IF NOT FOUND OR r.rolcanlogin IS DISTINCT FROM true OR r.rolsuper IS DISTINCT FROM false
 OR r.rolbypassrls IS DISTINCT FROM false OR r.rolcreaterole IS DISTINCT FROM false
 OR r.rolcreatedb IS DISTINCT FROM false OR r.rolreplication IS DISTINCT FROM false THEN
  RAISE EXCEPTION 'unsafe credential reader role';
 END IF;
END $$;
GRANT USAGE ON SCHEMA proxy_control TO proxy_credential_reader_login;
GRANT SELECT ON proxy_control.whatsapp_provisioning,
 proxy_control.whatsapp_credential_envelopes TO proxy_credential_reader_login;
-- The existing FORCE RLS policies require transaction-local app.organization_id.
-- Reader must have zero INSERT/UPDATE/DELETE access to the vault or sessions.
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER
 ON proxy_control.whatsapp_credential_envelopes FROM proxy_credential_reader_login;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER
 ON proxy_control.whatsapp_provisioning FROM proxy_credential_reader_login;
DO $$
BEGIN
 IF NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class
   WHERE oid='proxy_control.whatsapp_credential_envelopes'::regclass) OR
    NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class
   WHERE oid='proxy_control.whatsapp_provisioning'::regclass) THEN
  RAISE EXCEPTION 'vault RLS must be enabled and forced';
 END IF;
END $$;
COMMIT;
