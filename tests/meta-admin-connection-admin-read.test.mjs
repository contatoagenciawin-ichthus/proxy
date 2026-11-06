import test from 'node:test'
import assert from 'node:assert/strict'
import {createConnectionAdminReadStore} from '../lib/meta-admin/connection-admin-read-store.mjs'
const org='55555555-5555-4555-8555-555555555555'
const other='11111111-1111-4111-8111-111111111111'
function makePool({privileges={},rows=[]}={}){
 const trace=[]
 let released=false
 const pool={connect:async()=>({
  release(){released=true},
  async query(sql,params=[]){
   trace.push({sql,params})
   if(sql.includes('current_setting(\'is_superuser\')'))return {rows:[{name:'proxy_connection_admin_reader_login',superuser:'off',bypass_rls:false,create_role:false}]}
   if(sql.includes('has_table_privilege(current_user'))return {rows:[{read_receipts:true,insert_receipts:false,update_workflow:false,is_receiver:false,is_operator:false,...privileges}]}
   if(sql.includes('from proxy_control.connection_requests'))return {rows}
   return {rows:[]}
  }
 })}
 return {pool,trace,released:()=>released}
}
test('read-only scoped transaction returns receipts without write capability',async()=>{
 const f=makePool({rows:[{protocolId:'77777777-7777-4777-8777-777777777777',organizationId:org}]})
 const rows=await createConnectionAdminReadStore({pool:f.pool,allowedOrganizations:[org]}).listReceipts(org)
 assert.equal(rows.length,1)
 assert.ok(f.trace.some(q=>q.sql==='begin read only'))
 assert.ok(f.trace.some(q=>q.sql==='commit'))
 assert.ok(f.trace.some(q=>q.sql.includes('set_config')&&q.params[0]===org))
 assert.ok(f.trace.some(q=>q.sql.includes('where product=')&&q.params[0]===org))
 assert.equal(f.released(),true)
})
test('rejects unauthorized tenant before acquiring pool connection',async()=>{
 const f=makePool()
 const reader=createConnectionAdminReadStore({pool:f.pool,allowedOrganizations:[org]})
 await assert.rejects(reader.listReceipts(other),/admin_reader_org_denied/)
 assert.equal(f.trace.length,0)
})
test('rejects reader with insert receipt or workflow mutation grants',async()=>{
 for(const privileges of [{insert_receipts:true},{update_workflow:true},{is_receiver:true},{is_operator:true},{read_receipts:false}]){
  const f=makePool({privileges})
  await assert.rejects(createConnectionAdminReadStore({pool:f.pool,allowedOrganizations:[org]}).listReceipts(org),/unsafe_admin_reader_privileges/)
  assert.ok(!f.trace.some(q=>q.sql.includes('from proxy_control.connection_requests')))
 }
})
