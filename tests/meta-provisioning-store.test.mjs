import test from 'node:test'
import assert from 'node:assert/strict'
import {createProvisioningStore} from '../lib/meta-provisioning/provisioning-store.mjs'
const org='e9b935b6-3349-4b2c-970d-be8ad3bc243d'
const protocol='6419a70f-854d-4b7f-989a-25beaadabeed'
const operatorId='233162528'
const permit={organizationId:org,protocolId:protocol,operatorId,expectedWabaId:'107697061976892',expectedPhoneNumberId:'107612478652254'}
function harness({role='proxy_provisioning_runtime_login',receipt=true,existed=false,active=false,consume=true}={}){
 const calls=[]
 const client={
  async query(sql,values=[]){
   calls.push({sql,values})
   if(sql.includes('from pg_roles'))return {rows:[{name:role,rolcanlogin:true,rolsuper:false,rolbypassrls:false,rolcreaterole:false}]}
   if(sql.includes('has_table_privilege'))return {rows:[{receipt_read:true,receipt_write:false,vault_read:false,vault_write:false}]}
   if(sql.includes('from proxy_control.connection_requests'))return {rows:receipt?[{id:'e1111111-1111-4111-8111-111111111111',channel:'whatsapp',status:'received_by_proxy'}]:[]}
   if(sql.includes('insert into proxy_control.whatsapp_provisioning\n'))return {rows:existed?[]:[{id:'b1111111-1111-4111-8111-111111111111',phase:'operator_assigned',operator_id:operatorId}]}
   if(sql.includes('from proxy_control.whatsapp_provisioning\n'))return {rows:[{id:'b1111111-1111-4111-8111-111111111111',phase:'operator_assigned',operator_id:operatorId}]}
   if(sql.includes('from proxy_control.whatsapp_authorization_sessions'))return {rows:active?[{id:'a1111111-1111-4111-8111-111111111111'}]:[]}
   if(sql.includes('insert into proxy_control.whatsapp_authorization_sessions'))return {rows:[{id:'a1111111-1111-4111-8111-111111111111',expires_at:'2026-11-09T14:00:00Z'}]}
   if(sql.includes('from proxy_control.whatsapp_authorization_sessions s'))return {rows:consume?[{provisioning_id:'b1111111-1111-4111-8111-111111111111'}]:[]}
   return {rows:[]}
  },release(){calls.push({sql:'RELEASE'})}
 }
 return {calls,pool:{async connect(){return client}}}
}
test('tenant-specific transaction scopes RLS before querying receipt and commits',async()=>{
 const h=harness()
 const r=await createProvisioningStore({pool:h.pool}).beginFromReceipt({organizationId:org,protocolId:protocol,operatorId})
 assert.equal(r.created,true)
 const sql=h.calls.map(x=>x.sql)
 const begin=sql.indexOf('begin')
 const scope=sql.findIndex(x=>x.includes("set_config('app.organization_id'"))
 const receipt=sql.findIndex(x=>x.includes('from proxy_control.connection_requests'))
 assert.ok(begin>=0&&begin<scope&&scope<receipt)
 assert.equal(h.calls[scope].values[0],org)
 assert.ok(sql.includes('commit'))
 assert.ok(!sql.some(x=>/\\b(?:insert\\s+into|update|delete\\s+from)\\s+proxy_control\\.whatsapp_credential_envelopes/i.test(x)))
})
test('wrong receipt, role or ID fails closed with rollback and release',async()=>{
 const h=harness({receipt:false})
 await assert.rejects(createProvisioningStore({pool:h.pool}).beginFromReceipt({organizationId:org,protocolId:protocol,operatorId}),/receipt_not_eligible/)
 assert.ok(h.calls.some(x=>x.sql==='rollback'))
 assert.equal(h.calls.at(-1).sql,'RELEASE')
 const b=harness({role:'neondb_owner'})
 await assert.rejects(createProvisioningStore({pool:b.pool}).beginFromReceipt({organizationId:org,protocolId:protocol,operatorId}),/unsafe_runtime_role/)
 assert.ok(!b.calls.some(x=>x.sql==='begin'))
 const c=harness()
 await assert.rejects(createProvisioningStore({pool:c.pool}).beginFromReceipt({organizationId:'not-a-uuid',protocolId:protocol,operatorId}))
 assert.equal(c.calls.length,0)
})
test('idempotent begin does not duplicate operator audit for existing receipt',async()=>{
 const h=harness({existed:true})
 const r=await createProvisioningStore({pool:h.pool}).beginFromReceipt({organizationId:org,protocolId:protocol,operatorId})
 assert.equal(r.created,false)
 assert.ok(!h.calls.some(x=>x.sql.includes('insert into proxy_control.whatsapp_provisioning_events')))
})
test('authorization session uses a hash only, with single active session',async()=>{
 const h=harness()
 const r=await createProvisioningStore({pool:h.pool}).issueAuthorization(permit)
 assert.equal(r.nonce.length,43)
 const insert=h.calls.find(x=>x.sql.includes('insert into proxy_control.whatsapp_authorization_sessions'))
 assert.match(insert.values[3],/^[a-f0-9]{64}$/)
 assert.ok(!JSON.stringify(h.calls).includes(r.nonce))
 assert.equal(insert.values[4],permit.expectedWabaId)
 assert.ok(h.calls.some(x=>x.sql.includes("phase='awaiting_authorization'")))
 const pending=harness({active:true})
 await assert.rejects(createProvisioningStore({pool:pending.pool}).issueAuthorization(permit),/already_pending/)
})
test('authorization preflight performs read-only check and keeps one-time nonce secret',async()=>{
 const h=harness()
 const input={organizationId:org,protocolId:protocol,sessionId:'a1111111-1111-4111-8111-111111111111',nonce:'b'.repeat(43),operatorId,wabaId:permit.expectedWabaId,phoneNumberId:permit.expectedPhoneNumberId}
 const out=await createProvisioningStore({pool:h.pool}).checkAuthorization(input)
 assert.ok(out.provisioningId)
 const statement=h.calls.find(x=>x.sql.includes('from proxy_control.whatsapp_authorization_sessions s'))
 assert.ok(statement.sql.includes('consumed_at is null'))
 assert.ok(statement.sql.includes('expires_at>now()'))
 assert.ok(statement.sql.includes("p.phase='awaiting_authorization'"))
 assert.ok(!JSON.stringify(h.calls).includes(input.nonce))
 assert.ok(!h.calls.some(x=>x.sql.includes('update proxy_control.whatsapp_authorization_sessions')))
 const denied=harness({consume:false})
 await assert.rejects(createProvisioningStore({pool:denied.pool}).checkAuthorization(input),/invalid_or_consumed/)
})
