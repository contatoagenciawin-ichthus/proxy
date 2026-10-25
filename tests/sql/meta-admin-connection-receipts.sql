\set ON_ERROR_STOP on
BEGIN;
-- Validate least-privilege SQL semantics using the same NOLOGIN role inherited
-- by a future dedicated connection. Fixtures are synthetic and rolled back.
SET ROLE proxy_connection_receiver;
SELECT set_config('app.organization_id','11111111-1111-4111-8111-111111111111',true);
INSERT INTO proxy_control.connection_requests(product,organization_id,protocol_id,channel,version)
 VALUES('proxy-relationship','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','whatsapp',1)
 ON CONFLICT (product,organization_id,protocol_id) DO NOTHING;
INSERT INTO proxy_control.connection_requests(product,organization_id,protocol_id,channel,version)
 VALUES('proxy-relationship','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','whatsapp',1)
 ON CONFLICT (product,organization_id,protocol_id) DO NOTHING;
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM proxy_control.connection_requests;
 IF n<>1 THEN RAISE EXCEPTION 'tenant A must see exactly one receipt, observed %',n; END IF;
END $$;
-- Direct cross-tenant inserts must fail under enforced RLS.
DO $$
BEGIN
 BEGIN
 INSERT INTO proxy_control.connection_requests(product,organization_id,protocol_id,channel,version)
  VALUES('proxy-relationship','22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444','whatsapp',1);
 RAISE EXCEPTION 'RLS improperly permitted a cross-tenant insert';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
-- No UPDATE/DELETE privilege, so a receiver cannot forge progress or erase receipts.
DO $$
BEGIN
 BEGIN
 UPDATE proxy_control.connection_requests SET status='completed';
 RAISE EXCEPTION 'receiver improperly permitted to update receipts';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
SELECT set_config('app.organization_id','22222222-2222-4222-8222-222222222222',true);
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM proxy_control.connection_requests;
 IF n<>0 THEN RAISE EXCEPTION 'tenant B can see tenant A receipts'; END IF;
END $$;
INSERT INTO proxy_control.connection_requests(product,organization_id,protocol_id,channel,version)
 VALUES('proxy-relationship','22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555','whatsapp',1);
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM proxy_control.connection_requests;
 IF n<>1 THEN RAISE EXCEPTION 'tenant B must see its own receipt'; END IF;
END $$;
ROLLBACK;
