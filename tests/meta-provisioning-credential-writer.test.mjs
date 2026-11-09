import test from 'node:test'
import assert from 'node:assert/strict'
import {randomBytes} from 'node:crypto'
import {createCredentialWriter} from '../lib/meta-provisioning/credential-writer.mjs'
const identity={organizationId:'e9b935b6-3349-4b2c-970d-be8ad3bc243d',protocolId:'6419a70f-854d-4b7f-989a-25beaadabeed',wabaId:'107697061976892',phoneNumberId:'107612478652254',appId:'1952034255371331'}
const accessToken='example-opaque-token-not-real-characters'
const scopes=['whatsapp_business_management','whatsapp_business_messaging']
const operatorId='233162528'
const rootKeyHex=randomBytes(32).toString('hex')
function mock({role='proxy_credential_writer_login',phase='authorization_received',session=true,insert=true}={}){
 const calls=[]
 const db={
  async query(sql,values=[]){
   calls.push({sql,values})
   if(sql.includes('from pg_roles'))return {rows:[{name:role,rolsuper:false,rolbypassrls:false,rolcreaterole:false}]}
   if(sql.includes('from proxy_control.whatsapp_provisioning where'))return {rows:[{id:'b1111111-1111-4111-8111-111111111111',phase,operator_id:operatorId,waba_id:null,phone_number_id:null,meta_app_id:null}]}
   if(sql.includes('from proxy_control.whatsapp_authorization_sessions'))return {rows:session?[{'?column?':1}]:[]}
   if(sql.includes('insert into proxy_control.whatsapp_credential_envelopes'))return {rows:insert?[{provisioning_id:'b1111111-1111-4111-8111-111111111111'}]:[]}
   if(sql.includes('update proxy_control.whatsapp_provisioning set'))return {rows:[{id:'b1111111-1111-4111-8111-111111111111'}]}
   return {rows:[]}
  },release(){calls.push({sql:'RELEASE'})}
 }
 return {calls,pool:{async connect(){return db}}}
}
const args={identity,accessToken,grantedScopes:scopes,operatorId}
test('credential is sealed and transactional, no plaintext into SQL or audit',async()=>{
 const h=mock()
 const writer=createCredentialWriter({pool:h.pool,expectedAppId:identity.appId,rootKeyHex})
 const result=await writer.store(args)
 assert.equal(result.stored,true)
 assert.equal(result.fingerprint.length,16)
 assert.ok(!JSON.stringify(h.calls).includes(accessToken))
 const sql=h.calls.map(x=>x.sql)
 assert.ok(sql.includes('begin')&&sql.includes('commit'))
 assert.ok(sql.findIndex(x=>x.includes("set_config('app.organization_id'"))<sql.findIndex(x=>x.includes('whatsapp_provisioning where')))
 assert.equal(h.calls.find(x=>x.sql.includes('insert into proxy_control.whatsapp_credential_envelopes')).values[7],result.fingerprint)
})
test('wrong app and missing scopes fail before DB connection',async()=>{
 const h=mock()
 const writer=createCredentialWriter({pool:h.pool,expectedAppId:identity.appId,rootKeyHex})
 await assert.rejects(writer.store({...args,identity:{...identity,appId:'269938242876600'}}),/app_mismatch/)
 await assert.rejects(writer.store({...args,grantedScopes:[scopes[0]]}),/scopes_insufficient/)
 assert.equal(h.calls.length,0)
})
test('privileged or wrong DB user cannot access credential writer',async()=>{
 const h=mock({role:'neondb_owner'})
 await assert.rejects(createCredentialWriter({pool:h.pool,expectedAppId:identity.appId,rootKeyHex}).store(args),/unsafe_role/)
 assert.ok(!h.calls.some(x=>x.sql==='begin'))
})
test('wrong phase, missing session or duplicated credential fail closed',async()=>{
 for(const options of [{phase:'awaiting_authorization'},{session:false},{insert:false}]){
  const h=mock(options)
  await assert.rejects(createCredentialWriter({pool:h.pool,expectedAppId:identity.appId,rootKeyHex}).store(args))
  assert.ok(h.calls.some(x=>x.sql==='rollback'))
  assert.ok(!h.calls.some(x=>x.sql==='commit'))
  assert.equal(h.calls.at(-1).sql,'RELEASE')
 }
})
