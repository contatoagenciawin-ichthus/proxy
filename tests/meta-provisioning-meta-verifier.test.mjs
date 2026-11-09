import test from 'node:test'
import assert from 'node:assert/strict'
import {verifyMetaAuthorization,MetaAuthorizationError} from '../lib/meta-provisioning/meta-authorization-verifier.mjs'
const appId='1952034255371331',wabaId='107697061976892',phoneNumberId='107612478652254'
const appSecret='fake-test-app-secret-32-characters-long'
const authorizationCode='mock-oauth-one-time-auth-code'
const accessToken='fake-oauth-meta-business-integration-token'
const scopes=['whatsapp_business_management','whatsapp_business_messaging']
const args={appId,wabaId,phoneNumberId,appSecret,authorizationCode}
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body})
function mock({invalidApp=false,missingScopes=false,mismatchedPhone=false,paged=false,denied=false}={}){
 const calls=[]
 const fetchFn=async (url,options)=>{
  calls.push({url,options})
  assert.equal(options.redirect,'error')
  assert.equal(options.cache,'no-store')
  assert.ok(!url.includes(authorizationCode))
  assert.ok(!url.includes(appSecret))
  if(url.includes('/oauth/access_token'))return response({access_token:accessToken})
  if(options.body && new URLSearchParams(options.body).has('batch')){
   const [op]=JSON.parse(new URLSearchParams(options.body).get('batch'))
   assert.equal(op.method,'GET')
   assert.equal(new URL(op.relative_url,'https://graph.facebook.com/').searchParams.get('input_token'),accessToken)
   assert.ok(!url.includes(accessToken))
   return response([{code:200,body:JSON.stringify({data:{is_valid:true,app_id:invalidApp?'1234567890123456':appId,scopes:missingScopes?[]:scopes,expires_at:0}})}])
  }
  if(denied)return response({error:{message:'do-not-expose-this-meta-message',code:200}},403)
  if(url.includes('/phone_numbers'))return response({data:[{id:mismatchedPhone?'1234567890123456':phoneNumberId}],...(paged?{paging:{next:'https://graph.facebook.com/next'}}:{})})
  return response({id:wabaId})
 }
 return {calls,fetchFn}
}
test('authorization is checked server-side against app scopes WABA and number',async()=>{
 const h=mock()
 const result=await verifyMetaAuthorization({...args,fetchFn:h.fetchFn})
 assert.equal(result.appId,appId)
 assert.equal(result.phoneNumberId,phoneNumberId)
 assert.equal(result.accessToken,accessToken)
 assert.equal(result.expiresAt,null)
 assert.deepEqual(result.scopes,scopes)
 assert.equal(h.calls.length,4)
 assert.ok(h.calls.every(x=>x.options.method==='GET'||x.options.method==='POST'))
})
test('wrong application and missing scopes fail before any asset API call',async()=>{
 for(const props of [{invalidApp:true},{missingScopes:true}]){
  const h=mock(props)
  await assert.rejects(verifyMetaAuthorization({...args,fetchFn:h.fetchFn}),MetaAuthorizationError)
  assert.equal(h.calls.length,2)
 }
})
test('a different phone or an incomplete page is never treated as valid',async()=>{
 for(const props of [{mismatchedPhone:true},{paged:true}]){
  const h=mock(props)
  await assert.rejects(verifyMetaAuthorization({...args,fetchFn:h.fetchFn}),MetaAuthorizationError)
 }
})
test('failure sanitizes raw Meta errors',async()=>{
 const h=mock({denied:true})
 await assert.rejects(verifyMetaAuthorization({...args,fetchFn:h.fetchFn}),err=>{
  assert.ok(err instanceof MetaAuthorizationError)
  assert.ok(!err.message.includes('do-not-expose'))
  return true
 })
})
test('invalid code/asset does not call Meta',async()=>{
 const h=mock()
 await assert.rejects(verifyMetaAuthorization({...args,wabaId:'not-a-meta-id',fetchFn:h.fetchFn}))
 assert.equal(h.calls.length,0)
})
