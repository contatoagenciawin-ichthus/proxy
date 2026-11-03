import test from "node:test";
import assert from "node:assert/strict";
import {signConnectionRequest,verifyConnectionRequest,receiveConnectionRequest} from "../lib/meta-admin/connection-request-protocol.mjs";

// Mirrors CRM's immutable synthetic contract vector; not a runtime key.
const secret="g2-staging-test-vector-only-not-a-runtime-secret";
const organizationId="11111111-1111-4111-8111-111111111111";
const protocolId="55555555-5555-4555-8555-555555555555";
const timestamp=1792958000000;
const signature="f16b5187521fe77055d2ea89237449d8b486129173efa0cb59252d14abc6c55a";
const body={product:"proxy-relationship",organizationId,protocolId,channel:"whatsapp",status:"registered",version:1};

test("G2 receiver validates CRM signed contract vector and tenant allowlist",()=>{
 assert.equal(signConnectionRequest({body,timestamp,secret}),signature);
 assert.deepEqual(verifyConnectionRequest({body,timestamp,signature,secret,allowedTenants:[organizationId],now:timestamp}),body);
 assert.throws(()=>verifyConnectionRequest({body,timestamp,signature,secret,allowedTenants:[],now:timestamp}),/tenant_not_allowed/);
 assert.throws(()=>verifyConnectionRequest({body,timestamp,signature,secret,allowedTenants:[organizationId],now:timestamp+300001}),/stale_signature/);
});

test("G2 receiver only acknowledges matching stored receipt",async()=>{
 let writes=0;
 const store={async saveReceipt(request){writes++;return {product:request.product,organizationId:request.organizationId,protocolId:request.protocolId}}};
 const result=await receiveConnectionRequest({body,timestamp,signature,secret,allowedTenants:[organizationId],store,now:timestamp});
 assert.deepEqual(result,{product:body.product,organizationId,protocolId,receiptStatus:"received_by_proxy"});
 assert.equal(writes,1);
 await assert.rejects(receiveConnectionRequest({body,timestamp,signature,secret,allowedTenants:[organizationId],store:{saveReceipt:async()=>({product:body.product,organizationId,protocolId:"66666666-6666-4666-8666-666666666666"})},now:timestamp}),/invalid_receipt/);
});
