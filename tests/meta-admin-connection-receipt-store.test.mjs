import test from 'node:test'
import assert from 'node:assert/strict'
import {makeConnectionReceiptStore} from '../lib/meta-admin/connection-receipt-store.mjs'
const row={product:'proxy-relationship',organizationId:'11111111-1111-4111-8111-111111111111',protocolId:'22222222-2222-4222-8222-222222222222',channel:'whatsapp',version:1}
test('central store acknowledges only after its transaction commits and reused receipt matches',async()=>{
 let persisted=null,commits=0
 const store=makeConnectionReceiptStore({beginTransaction:async fn=>{
  const next=await fn({query:async(sql,args)=>{
   if(sql.startsWith('insert')){if(persisted)return {rows:[]};persisted={...row};return {rows:[persisted]}}
   return {rows:[persisted]}
  }})
  commits++;return next
 }})
 const first=await store.saveReceipt(row);const second=await store.saveReceipt(row)
 assert.equal(first.protocolId,row.protocolId);assert.deepEqual(second,first);assert.equal(commits,2)
})
test('central store does not acknowledge a failed or mismatched database write',async()=>{
 const broken=makeConnectionReceiptStore({beginTransaction:async fn=>fn({query:async()=>{throw new Error('database_offline')}})})
 await assert.rejects(broken.saveReceipt(row),/database_offline/)
 const mismatch=makeConnectionReceiptStore({beginTransaction:async fn=>fn({query:async()=>({rows:[{...row,version:2}]})})})
 await assert.rejects(mismatch.saveReceipt(row),/receipt_conflict/)
})
