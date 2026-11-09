import test from 'node:test'
import assert from 'node:assert/strict'
import {finalizeVerifiedMetaAuthorization} from '../lib/meta-provisioning/meta-authorization-finalize.mjs'
const id={organizationId:'e9b935b6-3349-4b2c-970d-be8ad3bc243d',protocolId:'6419a70f-854d-4b7f-989a-25beaadabeed',operatorId:'233162528',sessionId:'a1111111-1111-4111-8111-111111111111',nonce:'a'.repeat(43),wabaId:'107697061976892',phoneNumberId:'107612478652254'}
const appId='1952034255371331',appSecret='test-secret-very-long-auth-meta',code='test-one-time-code-only'
const token='synthetic-meta-token-value-not-real'
const response=obj=>({ok:true,status:200,json:async()=>obj})
function fixture({approved=true,storeSuccess=true}={}){
 const calls=[]
 const store={async checkAuthorization(input){
  calls.push('preflight')
  assert.equal(input.nonce,id.nonce)
  if(!approved)throw Error('not_authorized')
  return {provisioningId:'b1111111-1111-4111-8111-111111111111'}
 }}
 const fetchFn=async(url,init)=>{
  calls.push('meta:'+init.method)
  if(url.includes('/oauth/access_token'))return response({access_token:token})
  if(new URLSearchParams(init.body).has('batch'))return response([{code:200,body:JSON.stringify({data:{is_valid:true,app_id:appId,scopes:['whatsapp_business_management','whatsapp_business_messaging'],expires_at:0}})}])
  if(url.includes('/phone_numbers'))return response({data:[{id:id.phoneNumberId}]})
  return response({id:id.wabaId})
 }
 const writer={async store(input){
  calls.push('vault')
  assert.equal(input.nonce,id.nonce)
  assert.equal(input.identity.organizationId,id.organizationId)
  assert.equal(input.accessToken,token)
  return storeSuccess?{stored:true,provisioningId:'b1111111-1111-4111-8111-111111111111',fingerprint:'0123456789abcdef'}:{stored:false}
 }}
 return {calls,store,fetchFn,writer}
}
const inputs={...id,appId,appSecret,authorizationCode:code}
test('preflight must precede token exchange; writer receives verified result only',async()=>{
 const f=fixture()
 const r=await finalizeVerifiedMetaAuthorization({...inputs,...f})
 assert.equal(r.stored,true)
 assert.equal(f.calls[0],'preflight')
 assert.equal(f.calls.at(-1),'vault')
 assert.equal(f.calls.length,6)
 assert.ok(!JSON.stringify(r).includes(token))
 assert.ok(!JSON.stringify(r).includes(code))
})
test('rejected or consumed state prevents any Meta API request',async()=>{
 const f=fixture({approved:false})
 await assert.rejects(finalizeVerifiedMetaAuthorization({...inputs,...f}),/not_authorized/)
 assert.deepEqual(f.calls,['preflight'])
})
test('failed vault write cannot be called a successful onboarding',async()=>{
 const f=fixture({storeSuccess:false})
 await assert.rejects(finalizeVerifiedMetaAuthorization({...inputs,...f}),/storage_unverified/)
 assert.equal(f.calls.at(-1),'vault')
})
