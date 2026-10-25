import test from 'node:test'
import assert from 'node:assert/strict'
import {createCentralReceiptRuntime} from '../lib/meta-admin/connection-receiver-runtime.mjs'
const row={product:'proxy-relationship',organizationId:'11111111-1111-4111-8111-111111111111',protocolId:'22222222-2222-4222-8222-222222222222',channel:'whatsapp',version:1}
function fixture({superuser='off',bypass_rls=false,authorized=true,throwOnInsert=false}={}){
 const calls=[];let released=false
 const client={
  query:async(sql,args=[])=>{
   calls.push({sql,args})
   if(sql.includes('is_superuser'))return {rows:[{superuser,bypass_rls}]}
   if(sql.includes('pg_has_role'))return {rows:[{authorized}]}
   if(sql.includes('insert into proxy_control.connection_requests')){
    if(throwOnInsert)throw new Error('database_down')
    return {rows:[{product:row.product,organizationId:row.organizationId,protocolId:row.protocolId,channel:row.channel,version:1}]}
   }
   return {rows:[]}
  },
  release:()=>{released=true}
 }
 return {pool:{connect:async()=>client},calls,wasReleased:()=>released}
}
test('trusted restricted pool commits only after RLS-scoped receipt is written',async()=>{
 const f=fixture()
 const receipt=await createCentralReceiptRuntime({pool:f.pool}).saveReceipt(row)
 assert.equal(receipt.protocolId,row.protocolId)
 assert.ok(f.calls.some(x=>x.sql==='begin'))
 assert.ok(f.calls.some(x=>x.sql.includes('set_config')&&x.args[0]===row.organizationId))
 assert.ok(f.calls.some(x=>x.sql==='commit'))
 assert.equal(f.wasReleased(),true)
})
test('transaction rolls back and releases database connection on failure',async()=>{
 const f=fixture({throwOnInsert:true})
 await assert.rejects(createCentralReceiptRuntime({pool:f.pool}).saveReceipt(row),/database_down/)
 assert.ok(f.calls.some(x=>x.sql==='rollback'));assert.equal(f.wasReleased(),true)
})
test('rejects owner, bypassrls or unapproved db role before write',async()=>{
 for(const variation of [{superuser:'on'},{bypass_rls:true},{authorized:false}]){
  const f=fixture(variation)
  await assert.rejects(createCentralReceiptRuntime({pool:f.pool}).saveReceipt(row),/unsafe_receiver_database_role|receiver_role_not_granted/)
  assert.equal(f.calls.some(x=>x.sql.startsWith('insert into')),false)
  assert.equal(f.wasReleased(),true)
 }
})
