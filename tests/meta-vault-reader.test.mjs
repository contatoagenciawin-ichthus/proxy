import test from 'node:test'
import assert from 'node:assert/strict'
import {sealMetaCredential} from '../lib/meta-provisioning/credential-envelope.mjs'
import {createVaultDiagnostic} from '../lib/meta-provisioning/credential-reader.mjs'

const organizationId='e9b935b6-3349-4b2c-970d-be8ad3bc243d'
const protocolId='6419a70f-854d-4b7f-989a-25beaadabeed'
const wabaId='107697061976892'
const phoneNumberId='107612478652254'
const appId='1952034255371331'
const rootKeyHex='11'.repeat(32)
const token='EAA-test-diagnostic-opaque-token-long-enough'
const identity={organizationId,protocolId,wabaId,phoneNumberId,appId}
const envelope=sealMetaCredential({identity,accessToken:token,rootKeyHex})
const validRole={name:'proxy_credential_reader_login',rolcanlogin:true,rolsuper:false,rolbypassrls:false,rolcreaterole:false,rolcreatedb:false}
const privileges={vault_select:true,vault_insert:false,vault_update:false,vault_delete:false,provision_select:true,provision_update:false}
const args={organizationId,protocolId,wabaId,phoneNumberId}
function fakeDb({role=validRole,grants=privileges,rows}={}){
 const queries=[]
 const db={
  async query(sql,params){
   queries.push({sql,params})
   if(sql.startsWith('select current_user'))return {rows:[role]}
   if(sql.includes('has_table_privilege'))return {rows:[grants]}
   if(sql.includes('from proxy_control.whatsapp_provisioning p')){
    return {rows:rows??[{organization_id:organizationId,protocol_id:protocolId,waba_id:wabaId,
     phone_number_id:phoneNumberId,meta_app_id:appId,envelope_version:1,
     key_version:1,iv:envelope.iv,ciphertext:envelope.ciphertext,tag:envelope.tag,expires_at:null}]}
   }
   return {rows:[]}
  },
  release(){queries.push({sql:'released'})}
 }
 return {pool:{connect:async()=>db},queries}
}
const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data})
function fakeGraph(log){
 return async (url,options)=>{
  log.push({url,options})
  assert.equal(options.method,'GET')
  assert.equal(options.headers.Authorization,'Bearer '+token)
  if(url.includes('/phone_numbers?'))return response({data:[{id:phoneNumberId}]})
  if(url.includes(phoneNumberId+'?fields=webhook_configuration'))return response({webhook_configuration:{phone_number:{override_callback_uri:'https://phone.example.test/webhook'},whatsapp_business_account:{override_callback_uri:'https://waba.example.test/webhook'},application:{callback_url:'https://default.example.test/webhook'}}})
  if(url.includes('/subscribed_apps?'))return response({data:[{whatsapp_business_api_data:{id:appId},override_callback_uri:'https://app.proxyone.tech/api/meta/ichthus/whatsapp/webhook'}]})
  return response({id:wabaId})
 }
}

test('read-only reader checks scope, accesses encrypted vault, then queries only Graph GET',async()=>{
 const {pool,queries}=fakeDb(),calls=[]
 const diagnostic=createVaultDiagnostic({pool,rootKeyHex,appId,fetchFn:fakeGraph(calls)})
 const result=await diagnostic.check(args)
 assert.deepEqual(Object.values(result.checks).map(x=>x.status),['verified','verified','verified','verified','verified'])
 assert.ok(queries.some(x=>x.sql==='begin read only'))
 assert.ok(queries.some(x=>x.sql.includes("set_config('app.organization_id'")&&x.params[0]===organizationId))
 assert.ok(queries.some(x=>x.sql==='commit'))
 assert.equal(calls.length,4)
 assert.equal(result.checks.phoneOverride.detail,'https://phone.example.test/webhook')
 assert.ok(calls.every(x=>x.options.method==='GET'))
 assert.ok(!JSON.stringify(result).includes(token))
 assert.ok(!JSON.stringify(result).includes(envelope.ciphertext))
})

test('reader refuses privilege escalation before reading any vault rows',async()=>{
 const {pool,queries}=fakeDb({grants:{...privileges,vault_update:true}})
 const diagnostic=createVaultDiagnostic({pool,rootKeyHex,appId,fetchFn:async()=>{throw Error('must not call Graph')}})
 await assert.rejects(diagnostic.check(args),/reader_not_available/)
 assert.equal(queries.some(x=>x.sql.includes('from proxy_control.whatsapp_provisioning p')),false)
})

test('reader refuses cross-tenant or absent credential without any Graph call',async()=>{
 const {pool,queries}=fakeDb({rows:[]})
 const diagnostic=createVaultDiagnostic({pool,rootKeyHex,appId,fetchFn:async()=>{throw Error('Graph must not be called')}})
 await assert.rejects(diagnostic.check(args),/reader_not_available/)
 assert.ok(queries.some(x=>x.sql==='rollback'))
 await assert.rejects(diagnostic.check({...args,organizationId:'wrong'}),/reader_identity_invalid/)
})

test('not finding the app does not imply a callback override exists',async()=>{
 const {pool}=fakeDb()
 const diagnostic=createVaultDiagnostic({pool,rootKeyHex,appId,fetchFn:async (url,options)=>{
  assert.equal(options.method,'GET')
  if(url.includes('/subscribed_apps?'))return response({data:[]})
  if(url.includes('/phone_numbers?'))return response({data:[{id:phoneNumberId}]})
  return response({id:wabaId})
 }})
 const r=await diagnostic.check(args)
 assert.equal(r.checks.subscription.status,'not_found')
 assert.equal(r.checks.callback.status,'blocked')
})
