import test from 'node:test'
import assert from 'node:assert/strict'
import {signConnectionRequest,verifyConnectionRequest,receiveConnectionRequest} from '../lib/meta-admin/connection-request-protocol.mjs'
const a='5bb4db11-2a8d-41f3-a1a4-2e5d55d67e11'
const b='65878d7c-4b0b-4095-a118-7362e615ece2'
const id='ddf181d7-50d6-4eb4-a135-c2cba08338c5'
const secret='not-a-production-key-this-is-test-only-11111111'
const now=1792958000000
const body={organizationId:a,protocolId:id,product:'proxy-relationship',channel:'whatsapp',status:'registered',version:1}
const signature=signConnectionRequest({body,timestamp:now,secret})
const verify=(overrides={})=>verifyConnectionRequest({body,timestamp:now,signature,secret,allowedTenants:[a],now,...overrides})
test('valid scoped sender signed, no secrets sent in payload',()=>{assert.equal(verify().protocolId,id);assert.equal(Object.keys(body).length,6)})
test('reject replay stale timestamp and forged signatures',()=>{
 assert.throws(()=>verify({now:now+300001}),/stale_signature/)
 assert.throws(()=>verify({signature:'0'.repeat(64)}),/invalid_signature/)
 assert.throws(()=>verify({body:{...body,organizationId:b}}),/tenant_not_allowed/)
 assert.throws(()=>verify({allowedTenants:[b]}),/tenant_not_allowed/)
})
test('payload allowlist rejects arbitrary URLs, tokens and fake statuses',()=>{
 for(const altered of [{...body,token:'secret'}, {...body,status:'completed'}, {...body,product:'la-crm'}]){
 assert.throws(()=>verify({body:altered}),/invalid_payload|invalid_signature/)
 }
})
test('only durable-store acknowledgement counts as received',async()=>{
 await assert.rejects(receiveConnectionRequest({body,timestamp:now,signature,secret,allowedTenants:[a],now}),/receiver_storage_not_configured/)
 const calls=[]
 const store={saveReceipt:async row=>{calls.push(row);return {...row}}}
 const received=await receiveConnectionRequest({body,timestamp:now,signature,secret,allowedTenants:[a],now,store})
 assert.equal(received.receiptStatus,'received_by_proxy');assert.equal(calls.length,1)
 await assert.rejects(receiveConnectionRequest({body,timestamp:now,signature,secret,allowedTenants:[a],now,store:{saveReceipt:async()=>({protocolId:'other',organizationId:a,product:'proxy-relationship'})}}),/invalid_receipt/)
})
