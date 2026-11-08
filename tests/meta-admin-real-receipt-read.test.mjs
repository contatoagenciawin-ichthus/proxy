import test from 'node:test'
import assert from 'node:assert/strict'
import {createConnectionAdminReadStore} from '../lib/meta-admin/connection-admin-read-store.mjs'
import {findAdminRequestDetail} from '../lib/meta-admin/connection-request-detail.mjs'
const org='e9b935b6-3349-4b2c-970d-be8ad3bc243d'
const protocol='6419a70f-854d-4b7f-989a-25beaadabeed'
test('reader refuses a different CRM tenant before opening database',async()=>{
 let opened=false
 const store=createConnectionAdminReadStore({allowedOrganizations:[org],pool:{connect:async()=>{opened=true;throw Error('should not connect')}}})
 await assert.rejects(store.listReceipts('55555555-5555-4555-8555-555555555555'),/admin_reader_org_denied/)
 assert.equal(opened,false)
})
test('reader scopes the tenant inside read-only transaction and projects the real receipt',async()=>{
 let began=false,scoped=false,ended=false
 const query=async(sql,params=[])=>{
  if(sql.includes('current_user as name'))return {rows:[{name:'proxy_connection_admin_reader_login',superuser:'off',bypass_rls:false,create_role:false}]}
  if(sql.includes('has_table_privilege'))return {rows:[{read_receipts:true,insert_receipts:false,is_receiver:false}]}
  if(sql==='begin read only'){began=true;return {rows:[]}}
  if(sql.includes("set_config('app.organization_id'")){assert.deepEqual(params,[org]);assert.ok(began);scoped=true;return {rows:[]}}
  if(sql.includes('from proxy_control.connection_requests')){assert.ok(scoped);assert.deepEqual(params,[org]);return {rows:[{organizationId:org,protocolId:protocol,product:'proxy-relationship',channel:'whatsapp',status:'received_by_proxy',receivedAt:new Date('2026-11-08T16:41:18.955Z')}]}}
  if(sql==='commit'){ended=true;return {rows:[]}}
  throw Error('unexpected query '+sql)
 }
 let released=false
 const store=createConnectionAdminReadStore({allowedOrganizations:[org],pool:{connect:async()=>({query,release:()=>{released=true}})}})
 const rows=await store.listReceipts(org)
 assert.equal(rows.length,1);assert.equal(rows[0].protocolId,protocol)
 assert.ok(ended&&released)
 assert.equal(findAdminRequestDetail({inbound:{state:'ready',requests:rows},organizationId:org,protocolId:protocol}).state,'ready')
 assert.equal(findAdminRequestDetail({inbound:{state:'ready',requests:rows},organizationId:'55555555-5555-4555-8555-555555555555',protocolId:protocol}).state,'not_found')
})
test('read-enabled session must reject role with receipt write privileges',async()=>{
 let released=false
 const pool={connect:async()=>({query:async sql=>sql.includes('current_user as name')?{rows:[{name:'proxy_connection_admin_reader_login',superuser:'off',bypass_rls:false,create_role:false}]}:{rows:[{read_receipts:true,insert_receipts:true,is_receiver:false}]},release:()=>{released=true}})}
 await assert.rejects(createConnectionAdminReadStore({pool,allowedOrganizations:[org]}).listReceipts(org),/unsafe_admin_reader_privileges/)
 assert.equal(released,true)
})
