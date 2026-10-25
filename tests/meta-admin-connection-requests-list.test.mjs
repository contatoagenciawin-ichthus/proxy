import test from 'node:test'
import assert from 'node:assert/strict'
import {createCentralReceiptRuntime} from '../lib/meta-admin/connection-receiver-runtime.mjs'
const org='11111111-1111-4111-8111-111111111111'
test('admin receipt list runs under RLS in an explicit tenant transaction',async()=>{
 const queries=[]
 const pool={connect:async()=>({
  release(){},
  query:async(sql,params=[])=>{
   queries.push({sql,params})
   if(sql.includes('is_superuser'))return {rows:[{superuser:'off',bypass_rls:false}]}
   if(sql.includes('pg_has_role'))return {rows:[{authorized:true}]}
   if(sql.includes('from proxy_control.connection_requests'))return {rows:[{protocolId:'test'}]}
   return {rows:[]}
  }
 })}
 const rows=await createCentralReceiptRuntime({pool}).listReceipts(org)
 assert.equal(rows.length,1)
 assert.ok(queries.some(x=>x.sql.includes('set_config')&&x.params[0]===org))
 assert.ok(queries.some(x=>x.sql.includes('where organization_id=$1')&&x.params[0]===org))
 assert.ok(queries.some(x=>x.sql==='commit'))
})
test('tenant listing rejects malformed identifiers before querying',async()=>{
 const runtime=createCentralReceiptRuntime({pool:{connect:async()=>{throw Error('should not connect')}}})
 await assert.rejects(runtime.listReceipts('other-company'),/invalid_organization_id/)
})
