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

test('WABA override subscription performs only a scoped POST with override after endpoint verification',async()=>{
 const {pool}=fakeDb()
 const callbackUrl='https://app.proxyone.tech/api/meta/ichthus/whatsapp/webhook'
 const verifyToken='verification-token-for-ichthus-opaque-0001'
 let subscribed=false
 const calls=[]
 const fetchFn=async (url,options)=>{
  calls.push({url,method:options.method,body:options.body})
  if(url.startsWith(callbackUrl+'?')){
   const u=new URL(url)
   assert.equal(u.searchParams.get('hub.verify_token'),verifyToken)
   return {ok:true,text:async()=>u.searchParams.get('hub.challenge')}
  }
  assert.equal(options.headers.Authorization,'Bearer '+token)
  if(url.includes('/subscribed_apps')&&options.method==='POST'){
   assert.deepEqual(JSON.parse(options.body),{override_callback_uri:callbackUrl,verify_token:verifyToken})
   subscribed=true
   return response({success:true})
  }
  if(url.includes('/subscribed_apps'))return response({data:subscribed?[{whatsapp_business_api_data:{id:appId},override_callback_uri:callbackUrl}]:[]})
  if(url.includes('/phone_numbers?'))return response({data:[{id:phoneNumberId}]})
  if(url.includes('?fields=webhook_configuration'))return response({webhook_configuration:{}})
  return response({id:wabaId})
 }
 const client=createVaultDiagnostic({pool,rootKeyHex,appId,fetchFn})
 const r=await client.subscribeIchthusOverride({...args,callbackUrl,verifyToken})
 assert.equal(r.status,'verified')
 const posts=calls.filter(x=>x.method==='POST')
 assert.equal(posts.length,1)
 assert.equal(posts[0].url,'https://graph.facebook.com/v26.0/'+wabaId+'/subscribed_apps')
 assert.ok(!JSON.stringify(r).includes(token))
 assert.ok(!JSON.stringify(r).includes(verifyToken))
})
test('Meta refusal never triggers generic fallback subscription',async()=>{
 const {pool}=fakeDb()
 const callbackUrl='https://app.proxyone.tech/api/meta/ichthus/whatsapp/webhook'
 const verifyToken='verification-token-for-ichthus-opaque-0001'
 const posts=[]
 const fetchFn=async(url,options)=>{
  if(url.startsWith(callbackUrl+'?'))return {ok:true,text:async()=>new URL(url).searchParams.get('hub.challenge')}
  if(options.method==='POST'){
   posts.push(options.body)
   return response({error:{code:100,message:'Subscribe first'}},400)
  }
  if(url.includes('/subscribed_apps'))return response({data:[]})
  if(url.includes('/phone_numbers?'))return response({data:[{id:phoneNumberId}]})
  if(url.includes('webhook_configuration'))return response({webhook_configuration:{}})
  return response({id:wabaId})
 }
 const client=createVaultDiagnostic({pool,rootKeyHex,appId,fetchFn})
 const r=await client.subscribeIchthusOverride({...args,callbackUrl,verifyToken})
 assert.equal(r.status,'blocked')
 assert.equal(posts.length,1)
 assert.ok(JSON.parse(posts[0]).override_callback_uri)
})
test('invalid or redirected webhook handshake prevents all Meta mutations',async()=>{
 const {pool}=fakeDb(),posts=[]
 const fetchFn=async(url,options)=>{
  if(url.startsWith('https://app.proxyone.tech/'))return {ok:false,text:async()=>''}
  if(options.method==='POST')posts.push(url)
  if(url.includes('/subscribed_apps'))return response({data:[]})
  if(url.includes('/phone_numbers?'))return response({data:[{id:phoneNumberId}]})
  if(url.includes('webhook_configuration'))return response({webhook_configuration:{}})
  return response({id:wabaId})
 }
 const client=createVaultDiagnostic({pool,rootKeyHex,appId,fetchFn})
 const r=await client.subscribeIchthusOverride({...args,
  callbackUrl:'https://app.proxyone.tech/api/meta/ichthus/whatsapp/webhook',
  verifyToken:'verification-token-for-ichthus-opaque-0001'})
 assert.equal(r.status,'blocked')
 assert.equal(posts.length,0)
})

test('human reply sends exact text from sealed vault without returning token',async()=>{
 const {pool}=fakeDb(),calls=[];
 const diagnostic=createVaultDiagnostic({pool,rootKeyHex,appId,fetchFn:async(url,opts)=>{
  calls.push({url,opts});
  return response({messages:[{id:'wamid.HBgLMTIz'}]});
 }});
 const sent=await diagnostic.sendIchthusText({...args,recipient:'5511999000000',body:'Olá, podemos ajudar?'});
 assert.equal(sent.status,'accepted');
 assert.equal(sent.providerMessageId,'wamid.HBgLMTIz');
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,'https://graph.facebook.com/v26.0/'+phoneNumberId+'/messages');
 const data=JSON.parse(calls[0].opts.body);
 assert.deepEqual(data,{messaging_product:'whatsapp',recipient_type:'individual',
  to:'5511999000000',type:'text',text:{preview_url:false,body:'Olá, podemos ajudar?'}});
 assert.equal(calls[0].opts.headers.Authorization,'Bearer '+token);
 assert.equal(JSON.stringify(sent).includes(token),false);
});
test('outbound refuses unrelated WABA and numbers before token decryption',async()=>{
 const {pool,queries}=fakeDb();
 const diag=createVaultDiagnostic({pool,rootKeyHex,appId,fetchFn:async()=>{throw Error('unexpected')}});
 await assert.rejects(diag.sendIchthusText({...args,phoneNumberId:'123456789',recipient:'5511999000000',body:'Oi'}),/send_invalid_scope/);
 assert.equal(queries.length,0);
});
test('Meta transport failures report uncertain rather than false delivery',async()=>{
 const {pool}=fakeDb();
 const diag=createVaultDiagnostic({pool,rootKeyHex,appId,fetchFn:async()=>{throw Error('timeout')}});
 const result=await diag.sendIchthusText({...args,recipient:'5511999000000',body:'Oi'});
 assert.equal(result.status,'uncertain');
});
