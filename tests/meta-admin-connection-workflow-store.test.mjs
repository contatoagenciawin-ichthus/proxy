import test from 'node:test'
import assert from 'node:assert/strict'
import {createConnectionWorkflowStore} from '../lib/meta-admin/connection-workflow-store.mjs'
const organizationId='55555555-5555-4555-8555-555555555555'
const protocolId='77777777-7777-4777-8777-777777777777'
const actorId='233162528'
function fixture({authorized=true,receipt=true,version=1,eventFails=false}={}){
 const statements=[]
 let commits=0,rollbacks=0
 const beginTransaction=async work=>{
  try{const result=await work({query:async(sql,params=[])=>{
   statements.push({sql,params})
   if(sql.includes('select stage,assigned_operator_id')&&sql.includes('for update'))
    return {rows:receipt?[{stage:'received',assignedOperatorId:null,nextAction:null,version}]:[]}
   if(sql.includes('update proxy_control.connection_request_workflow'))return {rows:[{
    stage:params[2],assignedOperatorId:params[3],nextAction:params[4],version:version+1}]}
   if(sql.includes('insert into proxy_control.connection_request_workflow_events')&&eventFails)throw Error('event_insert_failed')
   if(sql.includes('select actor_id as'))return {rows:[]}
   return {rows:[]}
  }})};commits++;return result}catch(e){rollbacks++;throw e}
 }
 return {store:createConnectionWorkflowStore({beginTransaction,
  authorizeOperator:async()=>authorized}),statements,status:()=>({commits,rollbacks})}
}
test('persists stage and audit event in same tenant-scoped transaction',async()=>{
 const f=fixture()
 const r=await f.store.apply({organizationId,protocolId,actorId,action:'stage_change',expectedVersion:1,payload:{stage:'under_review'}})
 assert.equal(r.stage,'under_review');assert.equal(f.status().commits,1)
 assert.equal(f.statements[0].params[0],organizationId)
 assert.ok(f.statements.some(q=>q.sql.includes('insert into proxy_control.connection_request_workflow')&&q.sql.includes('from proxy_control.connection_requests')))
 assert.ok(f.statements.some(q=>q.sql.includes('for update')))
 assert.ok(f.statements.some(q=>q.sql.includes('insert into proxy_control.connection_request_workflow_events')))
})
test('rejects unauthorized operator without DB access',async()=>{
 const f=fixture({authorized:false})
 await assert.rejects(f.store.apply({organizationId,protocolId,actorId,action:'note',expectedVersion:1,payload:{text:'ok'}}),/workflow_operator_denied/)
 assert.equal(f.statements.length,0)
})
test('nonexistent receipt and stale version never commit',async()=>{
 for(const opts of [{receipt:false},{version:2}]){
  const f=fixture(opts)
  await assert.rejects(f.store.apply({organizationId,protocolId,actorId,action:'note',expectedVersion:1,payload:{text:'ok'}}))
  assert.equal(f.status().commits,0);assert.equal(f.status().rollbacks,1)
 }
})
test('audit insert failure rolls back entire mutation',async()=>{
 const f=fixture({eventFails:true})
 await assert.rejects(f.store.apply({organizationId,protocolId,actorId,action:'assign',expectedVersion:1,payload:{operatorId:actorId}}),/event_insert_failed/)
 assert.equal(f.status().commits,0);assert.equal(f.status().rollbacks,1)
})
test('cannot activate operational status via admin mutation',async()=>{
 const f=fixture()
 await assert.rejects(f.store.apply({organizationId,protocolId,actorId,action:'stage_change',expectedVersion:1,payload:{stage:'active'}}))
 assert.equal(f.status().commits,0)
})
