import test from 'node:test'
import assert from 'node:assert/strict'
import {handleConnectionRequestHttp} from '../lib/meta-admin/connection-request-http.mjs'
import {signConnectionRequest} from '../lib/meta-admin/connection-request-protocol.mjs'
const organizationId='11111111-1111-4111-8111-111111111111'
const protocolId='22222222-2222-4222-8222-222222222222'
const body={product:'proxy-relationship',organizationId,protocolId,channel:'whatsapp',status:'registered',version:1}
const secret='staged-tests-only-shared-hmac-secret-123456'
const now=1792958000000
function request({payload=body,signature,timestamp=now,raw}={}){
 const calculated=signature??signConnectionRequest({body:payload,timestamp,secret})
 return new Request('https://proxy.example.test/api/meta/admin/connection-requests',{
  method:'POST',headers:{'content-type':'application/json','x-proxy-request-timestamp':String(timestamp),'x-proxy-request-signature':calculated},
  body:raw??JSON.stringify(payload)
 })
}
const env={PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED:'true',PROXY_CONNECTION_REQUEST_SHARED_SECRET:secret,PROXY_CONNECTION_REQUEST_ALLOWED_ORGS:organizationId}
test('route remains disabled by default; missing store is unavailable',async()=>{
 assert.equal((await handleConnectionRequestHttp(request(),{env:{}})).status,503)
 assert.equal((await handleConnectionRequestHttp(request(),{env})).status,503)
})
test('valid signature only acknowledged after stored receipt',async()=>{
 let saved=0
 const store={saveReceipt:async()=>{saved++;return {product:'proxy-relationship',organizationId,protocolId}}}
 const response=await handleConnectionRequestHttp(request(),{env,store,now})
 assert.equal(response.status,200)
 assert.equal((await response.json()).receiptStatus,'received_by_proxy')
 assert.equal(saved,1)
})
test('denies bad tenant, stale timestamp, bad signature, oversize and failed storage',async()=>{
 const good={saveReceipt:async()=>({product:'proxy-relationship',organizationId,protocolId})}
 assert.equal((await handleConnectionRequestHttp(request(),{env:{...env,PROXY_CONNECTION_REQUEST_ALLOWED_ORGS:''},store:good,now})).status,401)
 assert.equal((await handleConnectionRequestHttp(request({timestamp:now-301000}),{env,store:good,now})).status,401)
 assert.equal((await handleConnectionRequestHttp(request({signature:'0'.repeat(64)}),{env,store:good,now})).status,401)
 assert.equal((await handleConnectionRequestHttp(request({raw:'x'.repeat(2049)}),{env,store:good,now})).status,413)
 assert.equal((await handleConnectionRequestHttp(request(),{env,store:{saveReceipt:async()=>{throw new Error('db offline')}},now})).status,503)
})
