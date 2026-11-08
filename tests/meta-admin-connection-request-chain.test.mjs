import test from 'node:test'
import assert from 'node:assert/strict'
import {createCentralReceiptRuntime} from '../lib/meta-admin/connection-receiver-runtime.mjs'
import {handleConnectionRequestHttp} from '../lib/meta-admin/connection-request-http.mjs'
import {signConnectionRequest} from '../lib/meta-admin/connection-request-protocol.mjs'
const org='11111111-1111-4111-8111-111111111111'
const other='22222222-2222-4222-8222-222222222222'
const id='33333333-3333-4333-8333-333333333333'
const secret='LOCAL_E2E_TEST_ONLY_RANDOM_SIGNING_VALUE_123'
const now=1792958000000
const env={PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED:'true',PROXY_CONNECTION_REQUEST_SHARED_SECRET:secret,PROXY_CONNECTION_REQUEST_ALLOWED_ORGS:org}
const body={product:'proxy-relationship',organizationId:org,protocolId:id,channel:'whatsapp',status:'registered',version:1}
function request(message=body,signature){
 const sig=signature??signConnectionRequest({body:message,timestamp:now,secret})
 return new Request('https://proxy.test/api/meta/admin/connection-requests',{method:'POST',headers:{'content-type':'application/json','x-proxy-request-timestamp':String(now),'x-proxy-request-signature':sig},body:JSON.stringify(message)})
}
function database(){
 const data=new Map(),calls=[]
 const pool={connect:async()=>{
  let orgContext=null
  return {release(){},query:async(sql,params=[])=>{
   calls.push(sql)
   if(sql.includes('is_superuser'))return {rows:[{superuser:'off',bypass_rls:false}]}
   if(sql.includes('pg_has_role'))return {rows:[{authorized:true}]}
   if(sql.includes('set_config')){orgContext=params[0];return {rows:[]}}
   if(sql.includes('insert into proxy_control.connection_requests')){
    if(params[1]!==orgContext)throw new Error('RLS_denied')
    const key=params[0]+'|'+params[1]+'|'+params[2]
    if(data.has(key))return {rows:[]}
    const row={product:params[0],organizationId:params[1],protocolId:params[2],channel:params[3],version:params[4]}
    data.set(key,row);return {rows:[row]}
   }
   if(sql.includes('from proxy_control.connection_requests')){
    const k=params.join('|')
    const row=data.get(k)
    return {rows:row?[row]:[]}
   }
   return {rows:[]}
  }}
 }}
 return {pool,data,calls}
}
test('signed HTTP -> restricted transaction -> durable receipt; same replay stays idempotent',async()=>{
 const db=database(),store=createCentralReceiptRuntime({pool:db.pool})
 const first=await handleConnectionRequestHttp(request(),{env,store,now})
 const second=await handleConnectionRequestHttp(request(),{env,store,now})
 assert.equal(first.status,200);assert.equal(second.status,200)
 assert.deepEqual(await first.json(),await second.json())
 assert.equal(db.data.size,1)
 assert.ok(db.calls.includes('commit'))
})
test('invalid tenant/signed payload never reaches the restricted database',async()=>{
 const db=database(),store=createCentralReceiptRuntime({pool:db.pool})
 const malicious={...body,organizationId:other}
 const response=await handleConnectionRequestHttp(request(malicious),{env,store,now})
 assert.equal(response.status,401);assert.equal(db.calls.length,0)
})
test('disabled route cannot persist even when store is configured',async()=>{
 const db=database(),store=createCentralReceiptRuntime({pool:db.pool})
 const response=await handleConnectionRequestHttp(request(),{env:{...env,PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED:'false'},store,now})
 assert.equal(response.status,503);assert.equal(db.data.size,0)
})
