import test from 'node:test';
import assert from 'node:assert/strict';
import {readIchthusOperationalTelemetry,validateIchthusTelemetry} from '../lib/meta-admin/ichthus-operational-telemetry.mjs';
const now=1794500000000;
const secret='test-secret-for-proxy-ichthus-telemetry-12345';
const example={
 ok:true,data:{version:1,source:'ichthus-crm-provider-events',observedAt:new Date(now).toISOString(),
 organizationId:'e9b935b6-3349-4b2c-970d-be8ad3bc243d',phoneNumberId:'107612478652254',
 lastInboundAt:new Date(now-180000).toISOString(),lastCrmOutboundAt:null,
 lastBusinessAppEchoAt:null,lastDeliveredAt:null,lastReadAt:null,lastFailedAt:null,
 deliveryFailures24h:1,inboundEvents24h:10}
};
test('signed request reads the fixed CRM telemetry path, no message content',async()=>{
 let call;
 const fetcher=async(url,opts)=>{call={url,opts};return new Response(JSON.stringify(example),{
  status:200,headers:{'content-type':'application/json'}
 })};
 const result=await readIchthusOperationalTelemetry({
  VERCEL_ENV:'production',PROXY_REQUEST_ADMIN_READ_ENABLED:'true',
  ICHTHUS_WHATSAPP_FORWARD_SECRET:secret},fetcher,now);
 assert.equal(result.state,'available');
 assert.equal(result.snapshot.deliveryFailures24h,1);
 assert.equal(call.url,'https://crm.ichthusmkt.com.br/api/relationship/whatsapp/telemetry');
 assert.equal(call.opts.method,'GET');
 assert.match(call.opts.headers['x-proxy-telemetry-signature'],/^sha256=[a-f0-9]{64}$/);
 assert.equal(Object.hasOwn(result.snapshot,'sender'),false);
});
test('feature remains disabled on Preview and fails closed on missing shared secret',async()=>{
 let requests=0;
 const fetcher=async()=>{requests++;throw Error('should not call')};
 assert.equal((await readIchthusOperationalTelemetry({},fetcher,now)).state,'disabled');
 assert.equal((await readIchthusOperationalTelemetry({VERCEL_ENV:'production',PROXY_REQUEST_ADMIN_READ_ENABLED:'true'},fetcher,now)).state,'unconfigured');
 assert.equal(requests,0);
});
test('reject stale, mismatched tenant and unexpected data fields',()=>{
 assert.equal(validateIchthusTelemetry(example,now).inboundEvents24h,10);
 assert.equal(validateIchthusTelemetry({...example,data:{...example.data,organizationId:'other'}},now),null);
 assert.equal(validateIchthusTelemetry({...example,data:{...example.data,observedAt:new Date(now-300000).toISOString()}},now),null);
 assert.equal(validateIchthusTelemetry({...example,data:{...example.data,body:'private'}},now),null);
 assert.equal(validateIchthusTelemetry({...example,data:{...example.data,deliveryFailures24h:-1}},now),null);
});
